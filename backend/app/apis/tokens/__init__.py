from datetime import datetime
from typing import Optional, List
from urllib.parse import urljoin

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
import requests
from bs4 import BeautifulSoup
from cachetools import TTLCache

from app.apis.websocket import manager

# Constants
PUMP_FUN_URL = "https://pump.fun/advanced"
DEX_SCREENER_URL = "https://api.dexscreener.com/latest/dex/search"

# Create router
router = APIRouter()

# Initialize cache with 5 minute TTL
token_cache = TTLCache(maxsize=100, ttl=300)  # 5 minutes cache

class TokenLink(BaseModel):
    """Model for token links"""
    type: str
    label: str
    url: str

class TokenMetrics(BaseModel):
    """Model for token price and volume metrics"""
    five_min_price: Optional[float] = None  # 5mP
    one_hour_price: Optional[float] = None  # 1hP
    six_hour_price: Optional[float] = None  # 6hP
    twenty_four_hour_price: Optional[float] = None  # 24hP
    five_min_volume: Optional[float] = None  # 5mV
    one_hour_volume: Optional[float] = None  # 1hV
    six_hour_volume: Optional[float] = None  # 6hV
    twenty_four_hour_volume: Optional[float] = None  # 24hV

class Token(BaseModel):
    """Model for token information"""
    name: str
    symbol: str
    market_cap: float
    created_at: datetime
    bonded_at: Optional[datetime] = None
    metrics: TokenMetrics
    chain_id: Optional[str] = None
    token_address: Optional[str] = None
    icon: Optional[str] = None
    description: Optional[str] = None
    links: Optional[List[TokenLink]] = None

class TokenList(BaseModel):
    """Model for list of tokens"""
    tokens: List[Token]
    total: int
    cached: bool

def scrape_pump_fun() -> List[Token]:
    """Scrape token data from pump.fun using requests and bs4"""
    try:
        # Set headers to mimic browser
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Connection': 'keep-alive',
        }
        
        # Fetch the page
        response = requests.get(PUMP_FUN_URL, headers=headers, timeout=30)
        response.raise_for_status()
        
        print(f"Response status: {response.status_code}")
        print(f"Response content: {response.text[:500]}...")
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find the table
        table = soup.find('table')
        if not table:
            print("No table found in HTML")
            return []
        
        # Extract token data
        tokens = []
        rows = table.find_all('tr')[1:]  # Skip header row
        
        for row in rows:
            try:
                # Extract cells
                cols = row.find_all('td')
                if len(cols) >= 13:  # We need all metrics
                    # Extract token address from link if available
                    token_link = cols[0].find('a')
                    token_address = token_link['href'].split('/')[-1] if token_link else None
                    
                    # Helper functions
                    def parse_percentage(text: str) -> Optional[float]:
                        try:
                            text = text.strip()
                            if text == '--' or not text:
                                return None
                            return float(text.replace('%', ''))
                        except ValueError:
                            return None
                    
                    def parse_volume(text: str) -> Optional[float]:
                        try:
                            text = text.strip()
                            if text == '--' or not text:
                                return None
                            # Remove K/M/B suffixes and convert
                            multiplier = 1
                            if text.endswith('K'):
                                multiplier = 1000
                                text = text[:-1]
                            elif text.endswith('M'):
                                multiplier = 1000000
                                text = text[:-1]
                            elif text.endswith('B'):
                                multiplier = 1000000000
                                text = text[:-1]
                            return float(text) * multiplier
                        except ValueError:
                            return None
                    
                    def parse_market_cap(text: str) -> float:
                        try:
                            text = text.strip().replace('$', '').replace(',', '')
                            return float(text) if text else 0.0
                        except ValueError:
                            return 0.0
                    
                    token = Token(
                        name=cols[0].text.strip(),
                        symbol=cols[1].text.strip(),
                        market_cap=parse_market_cap(cols[2].text),
                        created_at=datetime.strptime(cols[3].text.strip(), '%m/%d/%Y, %I:%M:%S %p'),
                        bonded_at=datetime.strptime(cols[4].text.strip(), '%m/%d/%Y, %I:%M:%S %p') if cols[4].text.strip() != '--' else None,
                        metrics=TokenMetrics(
                            five_min_price=parse_percentage(cols[5].text),
                            one_hour_price=parse_percentage(cols[6].text),
                            six_hour_price=parse_percentage(cols[7].text),
                            twenty_four_hour_price=parse_percentage(cols[8].text),
                            five_min_volume=parse_volume(cols[9].text),
                            one_hour_volume=parse_volume(cols[10].text),
                            six_hour_volume=parse_volume(cols[11].text),
                            twenty_four_hour_volume=parse_volume(cols[12].text)
                        ),
                        token_address=token_address
                    )
                    tokens.append(token)
            except Exception as row_err:
                print(f"Error processing row: {str(row_err)}")
                continue
        
        return tokens
    except Exception as e:
        print(f"Error scraping pump.fun: {str(e)}")
        return []

def fetch_dexscreener_data(query: str = None, token_address: str = None) -> List[Token]:
    """Fetch token data from DexScreener API"""
    try:
        # Build URL based on input
        if token_address:
            url = f"{DEX_SCREENER_URL.replace('search', f'tokens/{token_address}')}"
        elif query:
            url = f"{DEX_SCREENER_URL}?q={query}"
        else:
            raise ValueError("Either query or token_address must be provided")
        
        # Fetch data with timeout
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        tokens = []
        pairs = data.get('pairs', [])
        
        for pair in pairs:
            try:
                # Extract social links
                links = []
                if pair.get('url'):
                    links.append(TokenLink(type='dex', label='DEX', url=pair['url']))
                if pair.get('baseToken', {}).get('twitter'):
                    links.append(TokenLink(type='twitter', label='Twitter', 
                                         url=f"https://twitter.com/{pair['baseToken']['twitter']}"))
                
                token = Token(
                    name=pair.get('baseToken', {}).get('name', 'Unknown'),
                    symbol=pair.get('baseToken', {}).get('symbol', 'UNKNOWN'),
                    market_cap=float(pair.get('fdv', 0)),  # Fully diluted valuation as market cap
                    created_at=datetime.fromtimestamp(pair.get('pairCreatedAt', 0) / 1000),
                    bonded_at=None,  # Not available from dexscreener
                    metrics=TokenMetrics(
                        five_min_price=float(pair.get('priceChange', {}).get('m5', 0)),
                        one_hour_price=float(pair.get('priceChange', {}).get('h1', 0)),
                        six_hour_price=float(pair.get('priceChange', {}).get('h6', 0)),
                        twenty_four_hour_price=float(pair.get('priceChange', {}).get('h24', 0)),
                        five_min_volume=float(pair.get('volume', {}).get('m5', 0)),
                        one_hour_volume=float(pair.get('volume', {}).get('h1', 0)),
                        six_hour_volume=float(pair.get('volume', {}).get('h6', 0)),
                        twenty_four_hour_volume=float(pair.get('volume', {}).get('h24', 0))
                    ),
                    chain_id=pair.get('chainId'),
                    token_address=pair.get('baseToken', {}).get('address'),
                    links=links if links else None
                )
                tokens.append(token)
            except Exception as pair_err:
                print(f"Error processing pair: {str(pair_err)}")
                continue
        
        return tokens
    except Exception as e:
        print(f"Error fetching DexScreener data: {str(e)}")
        return []

@router.get("/tokens", response_model=TokenList)
def get_tokens() -> TokenList:
    """Get list of tokens with their details"""
    try:
        # Check cache first
        if 'tokens' in token_cache:
            return TokenList(
                tokens=token_cache['tokens'],
                total=len(token_cache['tokens']),
                cached=True
            )
        
        # Get newly created tokens from pump.fun
        tokens = scrape_pump_fun()
        
        # Get additional data from DexScreener for tokens with addresses
        for token in tokens:
            if token.token_address:
                try:
                    dex_tokens = fetch_dexscreener_data(token_address=token.token_address)
                    if dex_tokens:
                        # Update token with additional data from DexScreener
                        dex_token = dex_tokens[0]
                        token.chain_id = dex_token.chain_id
                        token.links = dex_token.links
                except Exception as e:
                    print(f"Error enriching token {token.symbol}: {str(e)}")
                    continue
        
        # Update cache
        token_cache['tokens'] = tokens
        
        return TokenList(
            tokens=tokens,
            total=len(tokens),
            cached=False
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e

@router.get("/tokens/{token_address}", response_model=Token)
def get_token_details(token_address: str) -> Token:
    """Get detailed information for a specific token"""
    try:
        # Check cache first
        cache_key = f'token_{token_address}'
        if cache_key in token_cache:
            return token_cache[cache_key]
        
        # Fetch from dexscreener
        tokens = fetch_dexscreener_data(token_address=token_address)
        if not tokens:
            raise HTTPException(status_code=404, detail=f"Token {token_address} not found")
        
        token = tokens[0]  # Use first token's data
        
        # Update cache
        token_cache[cache_key] = token
        
        return token
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Twitter, Link as LinkIcon } from "lucide-react";
import brain from "brain";
import { Token } from "types";
import { useWebSocket } from "utils/websocket";

// Dummy data for sparkline
const generateSparklineData = () => {
  return Array.from({ length: 10 }, (_, i) => ({
    value: Math.random() * 100,
  }));
};

export default function Tokens() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Token | "";
    direction: "asc" | "desc";
  }>({
    key: "",
    direction: "asc",
  });

  // Fetch tokens
  const fetchTokens = async () => {
    try {
      const response = await brain.get_tokens();
      const data = await response.json();
      setTokens(data.tokens);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setLoading(false);
    }
  };

  // Connect to WebSocket
  const { connect, disconnect, messages } = useWebSocket();

  useEffect(() => {
    // Initial fetch
    fetchTokens();
    
    // Connect to WebSocket
    connect();
    
    return () => {
      disconnect();
    };
  }, []);

  // Handle WebSocket messages
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      
      // Handle new token events
      if (lastMessage.type === 'newToken') {
        fetchTokens(); // Refresh token list
      }
      
      // Handle token trade events
      if (lastMessage.type === 'tokenTrade') {
        const { token, data } = lastMessage;
        setTokens(current => current.map(t => {
          if (t.token_address === token) {
            // Update token metrics based on trade data
            return {
              ...t,
              metrics: {
                ...t.metrics,
                // Update relevant metrics
                five_min_volume: (t.metrics.five_min_volume || 0) + data.volume,
                // Add other metric updates as needed
              }
            };
          }
          return t;
        }));
      }
    }
  }, [messages]);

  // Sort tokens
  const sortedTokens = React.useMemo(() => {
    if (!sortConfig.key) return tokens;

    return [...tokens].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [tokens, sortConfig]);

  // Filter tokens
  const filteredTokens = React.useMemo(() => {
    return sortedTokens.filter(
      (token) =>
        token.name.toLowerCase().includes(search.toLowerCase()) ||
        token.symbol.toLowerCase().includes(search.toLowerCase())
    );
  }, [sortedTokens, search]);

  // Handle sort
  const handleSort = (key: keyof Token) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc" ? "desc" : "asc",
    });
  };

  // Format number with K, M, B suffixes
  const formatNumber = (num: number) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  // Format date to match reference
  const formatDate = (date: Date) => {
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-[#111] text-gray-100 py-8 px-4">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h2 className="font-mono text-xl">NEW TOKEN ALERTS:</h2>
            <div className="flex items-center gap-2">
              <Switch
                checked={alertsEnabled}
                onCheckedChange={setAlertsEnabled}
                className="data-[state=checked]:bg-green-500"
              />
              <span className={`font-mono ${alertsEnabled ? 'text-green-500' : 'text-red-500'}`}>
                {alertsEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>
          <Input
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="font-mono max-w-sm bg-[#222] border-0"
          />
        </div>



        {/* Table */}
        <Card className="bg-[#111] border-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-800 hover:bg-transparent">
                <TableHead className="font-mono text-gray-400">Name</TableHead>
                <TableHead className="font-mono text-gray-400">Symbol</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">Market Cap</TableHead>
                <TableHead className="font-mono text-gray-400">Created</TableHead>
                <TableHead className="font-mono text-gray-400">Bonded</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">5mP</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">1hP</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">6hP</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">24hP</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">5mV</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">1hV</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">6hV</TableHead>
                <TableHead className="font-mono text-gray-400 text-right">24hV</TableHead>
                <TableHead className="font-mono text-gray-400">Links</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="text-center font-mono h-[200px] text-gray-400"
                  >
                    Loading tokens...
                  </TableCell>
                </TableRow>
              ) : filteredTokens.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={13}
                    className="text-center font-mono h-[200px] text-gray-400"
                  >
                    No tokens found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTokens.map((token) => (
                  <TableRow key={token.symbol} className="font-mono border-b border-gray-800 hover:bg-[#161616]">
                    <TableCell>{token.name}</TableCell>
                    <TableCell>{token.symbol}</TableCell>
                    <TableCell className="text-right">
                      ${formatNumber(token.market_cap)}
                    </TableCell>
                    <TableCell>{formatDate(new Date(token.created_at))}</TableCell>
                    <TableCell>
                      {token.bonded_at ? formatDate(new Date(token.bonded_at)) : '--'}
                    </TableCell>
                    <TableCell className={`text-right ${token.metrics.five_min_price ? (token.metrics.five_min_price >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                      {token.metrics.five_min_price?.toFixed(2) ?? '--'}
                    </TableCell>
                    <TableCell className={`text-right ${token.metrics.one_hour_price ? (token.metrics.one_hour_price >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                      {token.metrics.one_hour_price?.toFixed(2) ?? '--'}
                    </TableCell>
                    <TableCell className={`text-right ${token.metrics.six_hour_price ? (token.metrics.six_hour_price >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                      {token.metrics.six_hour_price?.toFixed(2) ?? '--'}
                    </TableCell>
                    <TableCell className={`text-right ${token.metrics.twenty_four_hour_price ? (token.metrics.twenty_four_hour_price >= 0 ? 'text-green-500' : 'text-red-500') : ''}`}>
                      {token.metrics.twenty_four_hour_price?.toFixed(2) ?? '--'}
                    </TableCell>
                    <TableCell className="text-right">
                      {token.metrics.five_min_volume ? formatNumber(token.metrics.five_min_volume) : '--'}
                    </TableCell>
                    <TableCell className="text-right">
                      {token.metrics.one_hour_volume ? formatNumber(token.metrics.one_hour_volume) : '--'}
                    </TableCell>
                    <TableCell className="text-right">
                      {token.metrics.six_hour_volume ? formatNumber(token.metrics.six_hour_volume) : '--'}
                    </TableCell>
                    <TableCell className="text-right">
                      {token.metrics.twenty_four_hour_volume ? formatNumber(token.metrics.twenty_four_hour_volume) : '--'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {token.links?.map((link, i) => (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-500 hover:text-blue-700"
                          >
                            {link.type === 'twitter' ? (
                              <Twitter className="w-4 h-4" />
                            ) : (
                              <LinkIcon className="w-4 h-4" />
                            )}
                          </a>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </div>
  );
}

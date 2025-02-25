import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// Stats data
const stats = [
  { label: "Tokens Tracked", value: "1,000+" },
  { label: "Price Updates", value: "Every 5m" },
  { label: "Data Sources", value: "2" },
  { label: "Active Alerts", value: "24/7" },
];

export default function App() {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background text-foreground relative">
      {/* Grid Background */}
      <div className="absolute inset-0 grid grid-cols-12 gap-4 pointer-events-none opacity-[0.02]">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="h-full w-full border-r border-primary" />
        ))}
      </div>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-24">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center space-y-8">
            <h1 className="font-mono text-6xl font-black tracking-tighter md:text-8xl">
              CRYPTO<span className="text-primary relative inline-block hover:scale-105 transition-transform duration-200 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-1 after:bg-primary">LENS</span>
            </h1>
            <p className="max-w-[600px] text-xl text-muted-foreground">
              Real-time tracking of newly launched memecoins and cryptocurrencies. Get instant insights on market caps, price changes, and trading volumes.
            </p>
            <Button 
              size="lg" 
              className="font-mono text-lg h-12 px-8 relative overflow-hidden transition-transform hover:scale-105 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] border-2 border-primary"
              onClick={() => navigate("/Tokens")}
            >
              START TRACKING
            </Button>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* Features Section */}
      {/* Stats Section */}
      <section className="py-12 bg-primary/5 border-y-2 border-primary/20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center transform hover:scale-105 transition-transform duration-200">
                <div className="font-mono text-4xl font-bold text-primary mb-2">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="font-mono text-4xl font-bold text-center mb-12">
            KEY FEATURES
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="border-2 border-primary bg-background/50 transform hover:scale-105 transition-all duration-200 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)]">
              <CardContent className="pt-6">
                <h3 className="font-mono text-xl font-bold mb-2">Real-Time Data</h3>
                <p className="text-muted-foreground">
                  Live updates from pump.fun and dexscreener.com for the latest token metrics and market movements.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary bg-background/50 transform hover:scale-105 transition-all duration-200 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)]">
              <CardContent className="pt-6">
                <h3 className="font-mono text-xl font-bold mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground">
                  Track market cap, price changes (5m to 24h), and trading volumes with detailed metrics.
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-primary bg-background/50 transform hover:scale-105 transition-all duration-200 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.15)]">
              <CardContent className="pt-6">
                <h3 className="font-mono text-xl font-bold mb-2">Smart Alerts</h3>
                <p className="text-muted-foreground">
                  Set custom alerts for price movements and new token launches to never miss an opportunity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Separator className="my-8" />

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-mono text-4xl font-bold mb-6">
            START TRACKING NOW
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-[600px] mx-auto">
            Join crypto traders who use CryptoLens to stay ahead of the market with real-time insights and alerts.
          </p>
          <Button 
            size="lg" 
            variant="outline" 
            className="font-mono text-lg h-12 px-8 border-2 relative overflow-hidden transition-transform hover:scale-105 hover:shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
            onClick={() => navigate("/Tokens")}
          >
            LAUNCH APP
          </Button>
        </div>
      </section>
    </div>
  );
}

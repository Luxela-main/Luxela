import { NextResponse } from "next/server";
import { checkDBHealth } from "@/app/api/lib/db";

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Check database connectivity
    const dbHealthy = await checkDBHealth();
    const dbTime = Date.now() - startTime;
    
    const response = {
      status: dbHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        healthy: dbHealthy,
        responseTime: dbTime,
      },
      environment: process.env.NODE_ENV,
    };
    
    return NextResponse.json(response, {
      status: dbHealthy ? 200 : 503,
    });
  } catch (error: any) {
    const dbTime = Date.now() - startTime;
    
    console.error('[HEALTH_CHECK] Error:', error);
    
    return NextResponse.json(
      {
        status: "error",
        message: error.message || "Health check failed",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: {
          healthy: false,
          responseTime: dbTime,
          error: error.message,
        },
        environment: process.env.NODE_ENV,
      },
      { status: 503 }
    );
  }
}
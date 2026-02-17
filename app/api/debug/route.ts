import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to test Tsara API connection and configuration
 * Usage: GET /api/debug
 * 
 * Returns:
 * - API configuration status
 * - Sample customer creation request/response
 * - Full error details if connection fails
 */
export async function GET(req: NextRequest) {
  // Check authorization (optional)
  const authHeader = req.headers.get('authorization');
  const isAuthorized = authHeader === `Bearer ${process.env.DEBUG_TOKEN}` || 
                       process.env.NODE_ENV === 'development';
  
  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const secretKey = process.env.TSARA_SECRET_KEY;
    const baseUrl = process.env.TSARA_BASE_URL;
    const sandboxUrl = 'https://sandbox.tsara.ng/v1';
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Use sandbox in development, production URL in production
    const apiUrl = nodeEnv === 'production' ? baseUrl : sandboxUrl;

    console.log('[DEBUG] Tsara Configuration Check:', {
      hasSecretKey: !!secretKey,
      hasBaseUrl: !!baseUrl,
      apiUrl: apiUrl,
      nodeEnv: nodeEnv,
      timestamp: new Date().toISOString(),
    });

    // Validate configuration
    if (!secretKey) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing TSARA_SECRET_KEY environment variable',
          config: {
            secretKey: 'NOT_SET',
            apiUrl: apiUrl,
            environment: nodeEnv,
          },
        },
        { status: 400 }
      );
    }

    if (!apiUrl) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing TSARA_BASE_URL environment variable',
          config: {
            secretKey: secretKey ? '***SET***' : 'NOT_SET',
            apiUrl: 'NOT_SET',
            environment: nodeEnv,
          },
        },
        { status: 400 }
      );
    }

    // Attempt customer creation
    const testEmail = `test-${Date.now()}@example.com`;
    const testPayload = {
      email: testEmail,
      name: 'Debug Test Customer',
      metadata: {
        test: true,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('[DEBUG] Attempting Tsara API request:', {
      method: 'POST',
      url: `${apiUrl}/customers`,
      payload: testPayload,
      headers: {
        'Authorization': `Bearer ${secretKey ? '***SET***' : 'NOT_SET'}`,
        'Content-Type': 'application/json',
      },
      secretKeyFormat: secretKey ? `${secretKey.substring(0, 10)}...${secretKey.substring(secretKey.length - 5)}` : 'NOT_SET',
    });

    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseData = await response.json().catch(() => ({}));

    console.log('[DEBUG] Tsara API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: responseData,
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'error',
          message: `Tsara API returned ${response.status}: ${response.statusText}`,
          config: {
            secretKey: secretKey ? '***SET***' : 'NOT_SET',
            apiUrl: apiUrl,
            environment: nodeEnv,
          },
          request: testPayload,
          response: {
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          },
        },
        { status: response.status }
      );
    }

    // Check response structure
    const customerId = responseData?.data?.id || responseData?.id;
    
    if (!customerId) {
      return NextResponse.json(
        {
          status: 'partial_error',
          message: 'Tsara API succeeded but no customer ID in response',
          config: {
            secretKey: secretKey ? '***SET***' : 'NOT_SET',
            apiUrl: apiUrl,
            environment: nodeEnv,
          },
          request: testPayload,
          response: {
            status: response.status,
            data: responseData,
          },
          analysis: {
            hasDataProperty: !!responseData.data,
            hasIdProperty: !!responseData.id,
            responseKeys: Object.keys(responseData),
          },
        },
        { status: 400 }
      );
    }

    // Success
    return NextResponse.json(
      {
        status: 'success',
        message: 'Tsara API connection verified successfully',
        config: {
          secretKey: secretKey ? '***SET***' : 'NOT_SET',
          apiUrl: apiUrl,
          environment: nodeEnv,
        },
        test: {
          email: testEmail,
          timestamp: new Date().toISOString(),
        },
        response: {
          status: response.status,
          customerId: customerId,
          fullData: responseData,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('[DEBUG] Unexpected error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        status: 'error',
        message: 'Unexpected error during Tsara API test',
        error: {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        help: 'Make sure TSARA_SECRET_KEY is set in your environment variables',
      },
      { status: 500 }
    );
  }
}

// Allow POST for direct testing
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    
    const secretKey = process.env.TSARA_SECRET_KEY;
    const baseUrl = process.env.TSARA_BASE_URL;
    const sandboxUrl = 'https://sandbox.tsara.ng/v1';
    const nodeEnv = process.env.NODE_ENV || 'development';
    
    // Use sandbox in development, production URL in production
    const apiUrl = nodeEnv === 'production' ? baseUrl : sandboxUrl;

    if (!secretKey || !apiUrl) {
      return NextResponse.json(
        { error: 'Missing Tsara configuration', help: 'Set TSARA_SECRET_KEY in environment' },
        { status: 400 }
      );
    }

    const response = await fetch(`${apiUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    return NextResponse.json(
      {
        status: response.ok ? 'success' : 'error',
        request: body,
        response: {
          status: response.status,
          data: responseData,
        },
      },
      { status: response.status }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
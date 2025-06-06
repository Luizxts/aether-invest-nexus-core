
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'User ID is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase client with service key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get user's Binance credentials
    const { data: credentials, error: credError } = await supabase
      .from('user_binance_credentials')
      .select('api_key_encrypted, secret_key_encrypted')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (credError || !credentials) {
      return new Response(
        JSON.stringify({ error: 'No active Binance credentials found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { api_key_encrypted: apiKey, secret_key_encrypted: secretKey } = credentials

    // Create signature for Binance API
    const timestamp = Date.now()
    const queryString = `timestamp=${timestamp}`
    
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secretKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(queryString)
    )
    
    const signatureHex = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Get account information from Binance
    const binanceUrl = `https://api.binance.com/api/v3/account?${queryString}&signature=${signatureHex}`
    
    const response = await fetch(binanceUrl, {
      headers: {
        'X-MBX-APIKEY': apiKey
      }
    })

    const data = await response.json()

    if (response.ok && data.balances) {
      // Calculate total balance in USDT
      let totalBalance = 0
      
      // Get USDT balance
      const usdtBalance = data.balances.find((b: any) => b.asset === 'USDT')
      if (usdtBalance) {
        totalBalance += parseFloat(usdtBalance.free) + parseFloat(usdtBalance.locked)
      }

      return new Response(
        JSON.stringify({ 
          balance: totalBalance,
          balances: data.balances.filter((b: any) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0)
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      return new Response(
        JSON.stringify({ error: data.msg || 'Failed to fetch balance' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error fetching Binance balance:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to fetch balance' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

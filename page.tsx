'use client'

import { FormEvent, useEffect, useState } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.9)',
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 24,
  padding: 24,
}

type AuthUser = {
  id: number
  full_name: string
  email: string
}

type Recommendation = {
  risk_band: string
  suggested_allocation: Record<string, number>
  suggested_instruments: Array<{
    asset_class: string
    instrument_name: string
    ticker: string
    category: string
    risk_level: string
    rationale: string
    annual_return_1y: number
    annualized_volatility_1y: number
    max_drawdown_1y: number
    expense_ratio: number
    liquidity_score: number
  }>
  explanation: string[]
  portfolio_insights: string[]
  learning_notes: string[]
  fire_summary: {
    required_nest_egg: number
    years_to_fire: number | null
    projected_portfolio: number
    message: string
  }
  volatility_note: string
  model_confidence: number
}

type FirePlan = {
  required_nest_egg: number
  years_to_fire: number | null
  projected_portfolio: number
  message: string
}

type Holding = {
  id: number
  user_id: number
  asset_type: string
  instrument_name: string
  ticker?: string | null
  amount_invested: number
  current_value: number
  purchase_date?: string | null
}

type Goal = {
  id: number
  user_id: number
  goal_type: string
  target_amount: number
  target_year?: number | null
  priority: 'low' | 'medium' | 'high'
}

type MarketSnapshotInstrument = {
  asset_class: string
  instrument_name: string
  ticker: string
  category: string
  risk_level: string
  annual_return_1y: number
  annualized_volatility_1y: number
  max_drawdown_1y: number
  expense_ratio: number
  liquidity_score: number
}

type Analytics = {
  holdings_concentration: Array<{
    label: string
    value: number
    weight: number
  }>
  target_allocation: Array<{
    label: string
    weight: number
  }>
  drift_analysis: Array<{
    label: string
    current_weight: number
    target_weight: number
    drift: number
  }>
  rebalance_guidance: string[]
  fire_progress: {
    current_portfolio: number
    required_nest_egg: number
    progress_ratio: number
  } | null
  market_history: Array<{
    ticker: string
    instrument_name: string
    snapshot_date: string
    annual_return_1y: number
    annualized_volatility_1y: number
  }>
}

export default function DashboardPage() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authToken, setAuthToken] = useState<string>('')
  const [authMessage, setAuthMessage] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [firePlan, setFirePlan] = useState<FirePlan | null>(null)
  const [marketSnapshot, setMarketSnapshot] = useState<MarketSnapshotInstrument[]>([])
  const [holdings, setHoldings] = useState<Holding[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [analytics, setAnalytics] = useState<Analytics>({
    holdings_concentration: [],
    target_allocation: [],
    drift_analysis: [],
    rebalance_guidance: [],
    fire_progress: null,
    market_history: [],
  })
  const [loading, setLoading] = useState(false)

  const [signupForm, setSignupForm] = useState({
    full_name: '',
    email: '',
    password: '',
  })

  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })

  const [profileForm, setProfileForm] = useState({
    age: 30,
    annual_income: 90000,
    monthly_expenses: 3200,
    cash_savings: 18000,
    total_assets: 45000,
    total_debt: 7000,
    dependents: 0,
    risk_tolerance: 'moderate',
    knowledge_level: 'beginner',
    goal_years: 15,
    target_amount: 1000000,
    retirement_target_age: 55,
    country: 'US',
    notes: '',
  })

  const [holdingForm, setHoldingForm] = useState({
    asset_type: 'ETF',
    instrument_name: '',
    ticker: '',
    amount_invested: 0,
    current_value: 0,
    purchase_date: '',
  })

  const [goalForm, setGoalForm] = useState({
    goal_type: 'Retirement',
    target_amount: 1000000,
    target_year: new Date().getFullYear() + 15,
    priority: 'high' as 'low' | 'medium' | 'high',
  })

  useEffect(() => {
    const storedUser = window.localStorage.getItem('finpilot_user')
    const storedToken = window.localStorage.getItem('finpilot_token')
    if (storedUser && storedToken) {
      setAuthUser(JSON.parse(storedUser))
      setAuthToken(storedToken)
    }
  }, [])

  useEffect(() => {
    async function loadDashboard() {
      if (!authUser || !authToken) return
      try {
        const res = await fetch(`${API_BASE}/dashboard/${authUser.id}`, {
          headers: {
            'X-Auth-Token': authToken,
          },
        })
        if (!res.ok) return
        const data = await res.json()
        setRecommendation(data.latest_recommendation || null)
        setFirePlan(data.latest_fire_plan || null)
        setHoldings(data.holdings || [])
        setGoals(data.goals || [])
        setAnalytics(
          data.analytics || {
            holdings_concentration: [],
            target_allocation: [],
            drift_analysis: [],
            rebalance_guidance: [],
            fire_progress: null,
            market_history: [],
          }
        )
      } catch {
        // Keep local session even if the dashboard hydration fails.
      }
    }

    loadDashboard()
  }, [authToken, authUser])

  function persistSession(user: AuthUser, token: string, message: string) {
    setAuthUser(user)
    setAuthToken(token)
    setAuthMessage(message)
    window.localStorage.setItem('finpilot_user', JSON.stringify(user))
    window.localStorage.setItem('finpilot_token', token)
  }

  function authHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Auth-Token': authToken,
    }
  }

  async function handleSignup(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to create account')
      persistSession(data.user, data.token, data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to login')
      persistSession(data.user, data.token, data.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleProfileAndRecommendation(event: FormEvent) {
    event.preventDefault()
    if (!authUser || !authToken) {
      setError('Create an account or login first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const profileRes = await fetch(`${API_BASE}/profiles`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          user_id: authUser.id,
          ...profileForm,
        }),
      })
      const profileData = await profileRes.json()
      if (!profileRes.ok) throw new Error(profileData.detail || 'Failed to save profile')

      const recommendationRes = await fetch(`${API_BASE}/recommendations`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          user_id: authUser.id,
          profile_id: profileData.id,
        }),
      })
      const recommendationData = await recommendationRes.json()
      if (!recommendationRes.ok) throw new Error(recommendationData.detail || 'Failed to generate recommendation')
      setRecommendation(recommendationData)
      setAnalytics((current) => ({
        ...current,
        target_allocation: Object.entries(recommendationData.suggested_allocation || {}).map(([label, weight]) => ({
          label,
          weight: Number(weight),
        })),
        drift_analysis: current.holdings_concentration.length
          ? Object.entries(recommendationData.suggested_allocation || {}).map(([label, weight]) => {
              const currentItem = current.holdings_concentration.find((item) => item.label === label)
              const currentWeight = currentItem ? currentItem.weight * 100 : 0
              return {
                label,
                current_weight: currentWeight,
                target_weight: Number(weight),
                drift: currentWeight - Number(weight),
              }
            })
          : [],
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Profile save failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleFirePlan() {
    if (!authUser || !authToken) {
      setError('Create an account or login first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/fire-plans`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          user_id: authUser.id,
          current_age: profileForm.age,
          target_amount: profileForm.target_amount,
          current_portfolio: profileForm.cash_savings + profileForm.total_assets,
          monthly_investment: Math.max(profileForm.annual_income / 12 * 0.18 - profileForm.monthly_expenses * 0.1, 0),
          annual_return_expectation: profileForm.risk_tolerance === 'high' ? 0.1 : profileForm.risk_tolerance === 'low' ? 0.06 : 0.08,
          annual_withdrawal_rate: 0.04,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to calculate FIRE plan')
      setFirePlan(data)
      setAnalytics((current) => ({
        ...current,
        fire_progress: {
          current_portfolio: profileForm.cash_savings + profileForm.total_assets,
          required_nest_egg: data.required_nest_egg,
          progress_ratio: data.required_nest_egg > 0 ? (profileForm.cash_savings + profileForm.total_assets) / data.required_nest_egg : 0,
        },
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'FIRE plan failed')
    } finally {
      setLoading(false)
    }
  }

  async function loadMarketSnapshot() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/market/snapshot`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to load market snapshot')
      setMarketSnapshot(data.instruments || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Market snapshot failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleMarketSync() {
    if (!authUser || !authToken) {
      setError('Create an account or login first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/market/sync`, {
        method: 'POST',
        headers: {
          'X-Auth-Token': authToken,
        },
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to sync market data')
      setAuthMessage(`Market sync complete. Snapshots added: ${data.synced_snapshots}`)
      await loadMarketSnapshot()
      const dashboardRes = await fetch(`${API_BASE}/dashboard/${authUser.id}`, {
        headers: {
          'X-Auth-Token': authToken,
        },
      })
      if (dashboardRes.ok) {
        const dashboardData = await dashboardRes.json()
        setAnalytics(dashboardData.analytics || analytics)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Market sync failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddHolding(event: FormEvent) {
    event.preventDefault()
    if (!authUser || !authToken) {
      setError('Create an account or login first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/holdings`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          user_id: authUser.id,
          ...holdingForm,
          purchase_date: holdingForm.purchase_date || null,
          ticker: holdingForm.ticker || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save holding')
      setHoldings((current) => {
        const next = [data, ...current]
        const total = next.reduce((sum, item) => sum + item.current_value, 0)
        const grouped = next.reduce<Record<string, number>>((acc, item) => {
          acc[item.asset_type] = (acc[item.asset_type] || 0) + item.current_value
          return acc
        }, {})
        setAnalytics((currentAnalytics) => ({
          ...currentAnalytics,
          holdings_concentration: Object.entries(grouped)
            .sort((a, b) => b[1] - a[1])
            .map(([label, value]) => ({
              label,
              value,
              weight: total > 0 ? value / total : 0,
            })),
        }))
        return next
      })
      setHoldingForm({
        asset_type: 'ETF',
        instrument_name: '',
        ticker: '',
        amount_invested: 0,
        current_value: 0,
        purchase_date: '',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Holding save failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddGoal(event: FormEvent) {
    event.preventDefault()
    if (!authUser || !authToken) {
      setError('Create an account or login first.')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE}/goals`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          user_id: authUser.id,
          ...goalForm,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.detail || 'Failed to save goal')
      setGoals((current) => [data, ...current])
      setGoalForm({
        goal_type: 'Retirement',
        target_amount: 1000000,
        target_year: new Date().getFullYear() + 15,
        priority: 'high',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Goal save failed')
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    setAuthUser(null)
    setAuthToken('')
    setAuthMessage('Logged out locally')
      setRecommendation(null)
      setFirePlan(null)
      setAnalytics({
        holdings_concentration: [],
        target_allocation: [],
        drift_analysis: [],
        rebalance_guidance: [],
        fire_progress: null,
        market_history: [],
      })
      window.localStorage.removeItem('finpilot_user')
      window.localStorage.removeItem('finpilot_token')
  }

  return (
    <main style={{ padding: '32px 20px 64px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gap: 20 }}>
        <section
          style={{
            ...cardStyle,
            background: 'linear-gradient(140deg, rgba(31,111,95,0.96), rgba(23,79,68,0.96))',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <div style={{ textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 12, opacity: 0.7 }}>Product workspace</div>
              <h1 style={{ fontSize: 44, margin: '8px 0 12px' }}>FinPilot Dashboard</h1>
              <p style={{ maxWidth: 720, lineHeight: 1.7, opacity: 0.88, margin: 0 }}>
                Create a user, capture a US financial profile, generate a personalized recommendation, and model a FIRE path from the same
                dashboard.
              </p>
            </div>
            <a href="/" style={{ padding: '12px 18px', borderRadius: 999, background: 'rgba(255,255,255,0.16)' }}>
              Back to overview
            </a>
          </div>
        </section>

        {error ? (
          <section style={{ ...cardStyle, borderColor: '#d7a29a', color: '#7e2f25' }}>{error}</section>
        ) : null}

        {authMessage ? (
          <section style={{ ...cardStyle, borderColor: 'rgba(31,111,95,0.2)', color: 'var(--accent-strong)' }}>
            {authMessage}
            {authUser ? ` User ID: ${authUser.id}` : ''}
          </section>
        ) : null}

        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Create Account</h2>
            <form onSubmit={handleSignup} style={{ display: 'grid', gap: 12 }}>
              <input style={inputStyle} placeholder="Full name" value={signupForm.full_name} onChange={(e) => setSignupForm({ ...signupForm, full_name: e.target.value })} />
              <input style={inputStyle} placeholder="Email" type="email" value={signupForm.email} onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })} />
              <input style={inputStyle} placeholder="Password" type="password" value={signupForm.password} onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })} />
              <button style={{ ...inputStyle, background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Working...' : 'Sign Up'}
              </button>
            </form>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Login</h2>
            <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
              <input style={inputStyle} placeholder="Email" type="email" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} />
              <input style={inputStyle} placeholder="Password" type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} />
              <button style={{ ...inputStyle, background: 'var(--accent-soft)', border: '1px solid rgba(31,111,95,0.16)', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Working...' : 'Login'}
              </button>
            </form>
          </section>
        </div>

        <section style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0 }}>Investor Profile</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>
                This form captures the financial and behavioral features used by the recommendation and FIRE engines.
              </p>
            </div>
            {authUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <strong>Active user: {authUser.full_name}</strong>
                <button style={{ ...inputStyle, width: 'auto', padding: '10px 14px', background: '#fff', fontWeight: 700 }} type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            ) : (
              <span style={{ color: 'var(--muted)' }}>No active user yet</span>
            )}
          </div>

          <form onSubmit={handleProfileAndRecommendation} style={{ display: 'grid', gap: 14, marginTop: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <input style={inputStyle} type="number" placeholder="Age" value={profileForm.age} onChange={(e) => setProfileForm({ ...profileForm, age: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Annual income" value={profileForm.annual_income} onChange={(e) => setProfileForm({ ...profileForm, annual_income: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Monthly expenses" value={profileForm.monthly_expenses} onChange={(e) => setProfileForm({ ...profileForm, monthly_expenses: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Cash savings" value={profileForm.cash_savings} onChange={(e) => setProfileForm({ ...profileForm, cash_savings: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Total assets" value={profileForm.total_assets} onChange={(e) => setProfileForm({ ...profileForm, total_assets: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Total debt" value={profileForm.total_debt} onChange={(e) => setProfileForm({ ...profileForm, total_debt: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Dependents" value={profileForm.dependents} onChange={(e) => setProfileForm({ ...profileForm, dependents: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Goal years" value={profileForm.goal_years} onChange={(e) => setProfileForm({ ...profileForm, goal_years: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Target amount" value={profileForm.target_amount} onChange={(e) => setProfileForm({ ...profileForm, target_amount: Number(e.target.value) })} />
            <input style={inputStyle} type="number" placeholder="Retirement target age" value={profileForm.retirement_target_age} onChange={(e) => setProfileForm({ ...profileForm, retirement_target_age: Number(e.target.value) })} />
            <select style={inputStyle} value={profileForm.risk_tolerance} onChange={(e) => setProfileForm({ ...profileForm, risk_tolerance: e.target.value })}>
              <option value="low">Low risk tolerance</option>
              <option value="moderate">Moderate risk tolerance</option>
              <option value="high">High risk tolerance</option>
            </select>
            <select style={inputStyle} value={profileForm.knowledge_level} onChange={(e) => setProfileForm({ ...profileForm, knowledge_level: e.target.value })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <textarea
              style={{ ...inputStyle, minHeight: 110, gridColumn: '1 / -1' }}
              placeholder="Optional notes about holdings, concerns, or goals"
              value={profileForm.notes}
              onChange={(e) => setProfileForm({ ...profileForm, notes: e.target.value })}
            />
            <button
              style={{
                ...inputStyle,
                gridColumn: '1 / -1',
                background: 'var(--accent)',
                color: '#fff',
                border: 'none',
                fontWeight: 700,
              }}
              disabled={loading}
            >
              {loading ? 'Working...' : 'Save Profile + Generate Recommendation'}
            </button>
          </form>
        </section>

        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Add Existing Holding</h2>
            <form onSubmit={handleAddHolding} style={{ display: 'grid', gap: 12 }}>
              <select style={inputStyle} value={holdingForm.asset_type} onChange={(e) => setHoldingForm({ ...holdingForm, asset_type: e.target.value })}>
                <option value="ETF">ETF</option>
                <option value="Mutual Fund">Mutual Fund</option>
                <option value="US Stock">US Stock</option>
                <option value="Bond ETF">Bond ETF</option>
                <option value="Gold ETF">Gold ETF</option>
                <option value="Cash">Cash</option>
              </select>
              <input style={inputStyle} placeholder="Instrument name" value={holdingForm.instrument_name} onChange={(e) => setHoldingForm({ ...holdingForm, instrument_name: e.target.value })} />
              <input style={inputStyle} placeholder="Ticker" value={holdingForm.ticker} onChange={(e) => setHoldingForm({ ...holdingForm, ticker: e.target.value.toUpperCase() })} />
              <input style={inputStyle} type="number" placeholder="Amount invested" value={holdingForm.amount_invested} onChange={(e) => setHoldingForm({ ...holdingForm, amount_invested: Number(e.target.value) })} />
              <input style={inputStyle} type="number" placeholder="Current value" value={holdingForm.current_value} onChange={(e) => setHoldingForm({ ...holdingForm, current_value: Number(e.target.value) })} />
              <input style={inputStyle} type="date" value={holdingForm.purchase_date} onChange={(e) => setHoldingForm({ ...holdingForm, purchase_date: e.target.value })} />
              <button style={{ ...inputStyle, background: 'var(--accent-soft)', border: '1px solid var(--border)', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Working...' : 'Save Holding'}
              </button>
            </form>
          </section>

          <section style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Add Financial Goal</h2>
            <form onSubmit={handleAddGoal} style={{ display: 'grid', gap: 12 }}>
              <input style={inputStyle} placeholder="Goal type" value={goalForm.goal_type} onChange={(e) => setGoalForm({ ...goalForm, goal_type: e.target.value })} />
              <input style={inputStyle} type="number" placeholder="Target amount" value={goalForm.target_amount} onChange={(e) => setGoalForm({ ...goalForm, target_amount: Number(e.target.value) })} />
              <input style={inputStyle} type="number" placeholder="Target year" value={goalForm.target_year} onChange={(e) => setGoalForm({ ...goalForm, target_year: Number(e.target.value) })} />
              <select style={inputStyle} value={goalForm.priority} onChange={(e) => setGoalForm({ ...goalForm, priority: e.target.value as 'low' | 'medium' | 'high' })}>
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
              <button style={{ ...inputStyle, background: 'var(--sun)', border: 'none', fontWeight: 700 }} disabled={loading}>
                {loading ? 'Working...' : 'Save Goal'}
              </button>
            </form>
          </section>
        </div>

        <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
          <section style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ margin: 0 }}>Recommendation Output</h2>
                <p style={{ color: 'var(--muted)', marginBottom: 0 }}>Allocation, instrument shortlist, volatility note, and learning guidance.</p>
              </div>
              <button style={{ ...inputStyle, width: 'auto', background: 'var(--sun)', border: 'none', fontWeight: 700 }} onClick={handleFirePlan} disabled={loading}>
                Run FIRE Planner
              </button>
              <button style={{ ...inputStyle, width: 'auto', background: 'var(--accent-soft)', border: '1px solid var(--border)', fontWeight: 700 }} onClick={loadMarketSnapshot} disabled={loading}>
                Load Market Snapshot
              </button>
              <button style={{ ...inputStyle, width: 'auto', background: '#fff', border: '1px solid var(--border)', fontWeight: 700 }} onClick={handleMarketSync} disabled={loading}>
                Sync Market To DB
              </button>
            </div>

            {recommendation ? (
              <div style={{ marginTop: 20, display: 'grid', gap: 18 }}>
                <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                  <div style={{ ...cardStyle, padding: 18 }}>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>Risk band</div>
                    <strong style={{ fontSize: 26, textTransform: 'capitalize' }}>{recommendation.risk_band}</strong>
                  </div>
                  <div style={{ ...cardStyle, padding: 18 }}>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>Model confidence</div>
                    <strong style={{ fontSize: 26 }}>{recommendation.model_confidence.toFixed(2)}</strong>
                  </div>
                  <div style={{ ...cardStyle, padding: 18 }}>
                    <div style={{ color: 'var(--muted)', fontSize: 13 }}>Years to FIRE</div>
                    <strong style={{ fontSize: 26 }}>{recommendation.fire_summary.years_to_fire ?? '60+'}</strong>
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Target Allocation</h3>
                  <div style={{ display: 'grid', gap: 10 }}>
                    {Object.entries(recommendation.suggested_allocation).map(([label, value]) => (
                      <div key={label} style={{ display: 'grid', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{label}</span>
                          <strong>{value}%</strong>
                        </div>
                        <div style={{ height: 10, borderRadius: 999, background: 'rgba(31,111,95,0.12)' }}>
                          <div style={{ height: '100%', width: `${value}%`, borderRadius: 999, background: 'var(--accent)' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: 18 }}>
                  <h3 style={{ marginTop: 0 }}>Suggested US Instruments</h3>
                  <div style={{ display: 'grid', gap: 12 }}>
                    {recommendation.suggested_instruments.map((item) => (
                      <div key={`${item.ticker}-${item.instrument_name}`} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                          <strong>
                            {item.instrument_name} ({item.ticker})
                          </strong>
                          <span style={{ color: 'var(--muted)' }}>
                            {item.asset_class} | {item.category} | {item.risk_level}
                          </span>
                        </div>
                        <p style={{ marginBottom: 0, color: 'var(--muted)' }}>{item.rationale}</p>
                        <p style={{ marginBottom: 0, color: 'var(--muted)', fontSize: 14 }}>
                          1Y return {Math.round(item.annual_return_1y * 1000) / 10}% | volatility {Math.round(item.annualized_volatility_1y * 1000) / 10}% | drawdown {Math.round(item.max_drawdown_1y * 1000) / 10}% | expense ratio {Math.round(item.expense_ratio * 10000) / 100}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p style={{ marginTop: 20, color: 'var(--muted)' }}>Save a profile to generate a recommendation.</p>
            )}
          </section>

          <section style={{ display: 'grid', gap: 20 }}>
            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Explanation Layer</h2>
              {recommendation ? (
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--muted)' }}>
                  {recommendation.explanation.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Explanation bullets appear after recommendation generation.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Portfolio Gap Insights</h2>
              {recommendation ? (
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--muted)' }}>
                  {recommendation.portfolio_insights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Concentration and goal-pressure insights appear here after recommendation generation.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Holdings Concentration Chart</h2>
              {analytics.holdings_concentration.length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {analytics.holdings_concentration.map((item) => (
                    <div key={item.label} style={{ display: 'grid', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.label}</span>
                        <strong>{Math.round(item.weight * 1000) / 10}%</strong>
                      </div>
                      <div style={{ height: 12, background: 'rgba(31,111,95,0.12)', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: `${item.weight * 100}%`, background: 'var(--accent)', borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Add holdings to see concentration by asset type.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Target Allocation Chart</h2>
              {analytics.target_allocation.length ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  {analytics.target_allocation.map((item) => (
                    <div key={item.label} style={{ display: 'grid', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>{item.label}</span>
                        <strong>{item.weight}%</strong>
                      </div>
                      <div style={{ height: 12, background: 'rgba(242,198,109,0.25)', borderRadius: 999 }}>
                        <div style={{ height: '100%', width: `${item.weight}%`, background: 'var(--sun)', borderRadius: 999 }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Generate a recommendation to see target allocation visually.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Allocation Drift Chart</h2>
              {analytics.drift_analysis.length ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {analytics.drift_analysis.map((item) => (
                    <div key={item.label} style={{ display: 'grid', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                        <strong>{item.label}</strong>
                        <span style={{ color: item.drift > 0 ? '#9a4b18' : '#1f6f5f' }}>
                          Current {item.current_weight.toFixed(1)}% | Target {item.target_weight.toFixed(1)}% | Drift {item.drift > 0 ? '+' : ''}{item.drift.toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ display: 'grid', gap: 6 }}>
                        <div style={{ height: 10, background: 'rgba(31,111,95,0.12)', borderRadius: 999 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, item.current_weight)}%`, background: 'var(--accent)', borderRadius: 999 }} />
                        </div>
                        <div style={{ height: 10, background: 'rgba(242,198,109,0.25)', borderRadius: 999 }}>
                          <div style={{ height: '100%', width: `${Math.min(100, item.target_weight)}%`, background: 'var(--sun)', borderRadius: 999 }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Add holdings and generate a recommendation to compare current vs target allocation.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Rebalance Guidance</h2>
              {analytics.rebalance_guidance.length ? (
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--muted)' }}>
                  {analytics.rebalance_guidance.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Once the current portfolio and target mix diverge meaningfully, rebalance guidance appears here.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Learning Path</h2>
              {recommendation ? (
                <ul style={{ paddingLeft: 20, lineHeight: 1.8, color: 'var(--muted)' }}>
                  {recommendation.learning_notes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Beginner or advanced learning notes will show here.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>FIRE Snapshot</h2>
              {firePlan ? (
                <div style={{ color: 'var(--muted)', lineHeight: 1.8 }}>
                  <p>
                    <strong>Required nest egg:</strong> ${firePlan.required_nest_egg.toLocaleString()}
                  </p>
                  <p>
                    <strong>Projected portfolio:</strong> ${firePlan.projected_portfolio.toLocaleString()}
                  </p>
                  <p>
                    <strong>Years to FIRE:</strong> {firePlan.years_to_fire ?? 'Longer than 60 years'}
                  </p>
                  <p style={{ marginBottom: 0 }}>{firePlan.message}</p>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Run the FIRE planner after saving a profile.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>FIRE Progress Chart</h2>
              {analytics.fire_progress ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ height: 16, background: 'rgba(31,111,95,0.12)', borderRadius: 999 }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.max(6, analytics.fire_progress.progress_ratio * 100)}%`,
                        maxWidth: '100%',
                        background: 'linear-gradient(90deg, var(--accent), var(--sun))',
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div style={{ color: 'var(--muted)', lineHeight: 1.7 }}>
                    <div>Current portfolio: ${analytics.fire_progress.current_portfolio.toLocaleString()}</div>
                    <div>Required nest egg: ${analytics.fire_progress.required_nest_egg.toLocaleString()}</div>
                    <div>Progress: {Math.round(analytics.fire_progress.progress_ratio * 1000) / 10}%</div>
                  </div>
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Run the FIRE planner to see progress toward the target corpus.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Volatility Note</h2>
              <p style={{ color: 'var(--muted)', marginBottom: 0 }}>{recommendation?.volatility_note || 'Risk commentary appears here after a recommendation is generated.'}</p>
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Market Snapshot</h2>
              {marketSnapshot.length ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {marketSnapshot.slice(0, 6).map((item) => (
                    <div key={`${item.ticker}-${item.asset_class}`} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <strong>
                          {item.instrument_name} ({item.ticker})
                        </strong>
                        <span style={{ color: 'var(--muted)' }}>{item.asset_class}</span>
                      </div>
                      <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>
                        1Y return {Math.round(item.annual_return_1y * 1000) / 10}% | volatility {Math.round(item.annualized_volatility_1y * 1000) / 10}% | liquidity score {item.liquidity_score.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Load the tracked US instrument universe to inspect the ranking inputs.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Stored Market History</h2>
              {analytics.market_history.length ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {analytics.market_history.map((item) => (
                    <div key={`${item.ticker}-${item.snapshot_date}`} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <strong>
                          {item.instrument_name} ({item.ticker})
                        </strong>
                        <span style={{ color: 'var(--muted)' }}>{item.snapshot_date}</span>
                      </div>
                      <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>
                        1Y return {Math.round(item.annual_return_1y * 1000) / 10}% | volatility {Math.round(item.annualized_volatility_1y * 1000) / 10}%
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>Sync market data to MySQL to start building stored history.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Saved Holdings</h2>
              {holdings.length ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {holdings.map((item) => (
                    <div key={item.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <strong>{item.instrument_name}{item.ticker ? ` (${item.ticker})` : ''}</strong>
                        <span style={{ color: 'var(--muted)' }}>{item.asset_type}</span>
                      </div>
                      <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>
                        Invested ${item.amount_invested.toLocaleString()} | Current ${item.current_value.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No holdings saved yet.</p>
              )}
            </article>

            <article style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Saved Goals</h2>
              {goals.length ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {goals.map((item) => (
                    <div key={item.id} style={{ paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                        <strong>{item.goal_type}</strong>
                        <span style={{ color: 'var(--muted)', textTransform: 'capitalize' }}>{item.priority} priority</span>
                      </div>
                      <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>
                        Target ${item.target_amount.toLocaleString()}{item.target_year ? ` by ${item.target_year}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>No goals saved yet.</p>
              )}
            </article>
          </section>
        </div>
      </div>
    </main>
  )
}

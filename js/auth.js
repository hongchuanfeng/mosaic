(function(){
    const SUPABASE_URL = 'https://byzomtkatfvwtnpwfdby.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ5em9tdGthdGZ2d3RucHdmZGJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3NzgwNTEsImV4cCI6MjA3ODM1NDA1MX0.TmrBVEErxnhLPRV-xdP3G1B7B_z-BTx7gNeq821v32I';

    let client = null;
    let isLoadingSupabase = false;
    let supabaseReadyPromise = null;

    function loadSupabaseIfNeeded(){
        if (window.supabase) {
            return Promise.resolve();
        }
        if (isLoadingSupabase) {
            return supabaseReadyPromise || Promise.resolve();
        }
        isLoadingSupabase = true;
        supabaseReadyPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.46.1/dist/umd/supabase.js';
            script.async = true;
            script.onload = () => resolve();
            script.onerror = (e) => reject(e);
            document.head.appendChild(script);
        });
        return supabaseReadyPromise;
    }

    function ensureClient(){
        if (!client && window.supabase) {
            client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return client;
    }

    function setLoggedInUI(loginBtn, loginLabel, user){
        if (!loginBtn || !loginLabel) return;
        const email = (user && user.email) ? user.email : 'Signed in';
        loginLabel.textContent = email;
        loginBtn.setAttribute('aria-label', 'Sign out');
    }
    function setLoggedOutUI(loginBtn, loginLabel){
        if (!loginBtn || !loginLabel) return;
        loginLabel.textContent = 'Sign in with Google';
        loginBtn.setAttribute('aria-label', 'Sign in with Google');
    }

    async function upsertUser(user){
        try{
            const c = ensureClient();
            if (!c || !user) return;
            await c.from('users').upsert({
                id: user.id,
                email: user.email,
                last_login: new Date().toISOString()
            }, { onConflict: 'id' });
        }catch(e){
            console.warn('User upsert skipped:', e && e.message ? e.message : e);
        }
    }

    async function refreshSessionUI(loginBtn, loginLabel){
        const c = ensureClient();
        if (!c) return;
        const { data } = await c.auth.getUser();
        if (data && data.user){
            setLoggedInUI(loginBtn, loginLabel, data.user);
        } else {
            setLoggedOutUI(loginBtn, loginLabel);
        }
    }

    async function signInWithGoogle(){
        const c = ensureClient();
        if (!c) return;
        const redirectTo = window.location.origin + window.location.pathname;
        await c.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo }
        });
    }

    async function signOut(){
        const c = ensureClient();
        if (!c) return;
        await c.auth.signOut();
    }

    // Public API
    window.AppAuth = {
        async init(options){
            const opts = options || {};
            await loadSupabaseIfNeeded();
            ensureClient();

            const loginBtn = opts.loginButtonId ? document.getElementById(opts.loginButtonId) : null;
            const loginLabel = opts.loginLabelId ? document.getElementById(opts.loginLabelId) : null;

            // Session changes
            if (client){
                client.auth.onAuthStateChange(async (event, session) => {
                    if (session && session.user){
                        setLoggedInUI(loginBtn, loginLabel, session.user);
                        upsertUser(session.user);
                    } else {
                        setLoggedOutUI(loginBtn, loginLabel);
                    }
                });
            }

            // Button wiring
            if (loginBtn){
                loginBtn.addEventListener('click', async function(){
                    const c = ensureClient();
                    const { data } = await c.auth.getUser();
                    if (data && data.user){
                        await signOut();
                        setLoggedOutUI(loginBtn, loginLabel);
                        return;
                    }
                    await signInWithGoogle();
                });
            }

            // Initial UI
            await refreshSessionUI(loginBtn, loginLabel);
        },

        getClient(){
            return ensureClient();
        },

        async getUser(){
            await loadSupabaseIfNeeded();
            const c = ensureClient();
            if (!c) return null;
            const { data } = await c.auth.getUser();
            return data ? data.user : null;
        },

        async signIn(){
            await loadSupabaseIfNeeded();
            ensureClient();
            await signInWithGoogle();
        },

        async signOut(){
            await loadSupabaseIfNeeded();
            ensureClient();
            await signOut();
        },

        onAuthStateChange(callback){
            const c = ensureClient();
            if (!c || typeof callback !== 'function') return { data: null, error: null };
            return c.auth.onAuthStateChange(callback);
        }
    };
})();


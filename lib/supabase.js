import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://oypyodjlcsruqnwuljhj.supabase.co"
const supabaseKey = "sb_publishable_epTLzkU72hTaIe105kDGLg_0wLOKZBA"

export const supabase = createClient(supabaseUrl, supabaseKey)
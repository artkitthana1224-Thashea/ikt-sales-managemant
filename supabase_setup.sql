-- ==========================================
-- CRM Sales Management System - Phase 1 Schema
-- Copy and paste this script into your Supabase SQL Editor
-- ==========================================

-- 1. Create CUSTOMERS Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    tax_id VARCHAR(50),
    industry_type VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    payment_term VARCHAR(50),
    status VARCHAR(50) DEFAULT 'Active', -- 'Active', 'Inactive'
    contacts JSONB DEFAULT '[]'::jsonb, -- Array of contact persons
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create Policies (Allowing Anonymous or Authenticated reading and writing for the DEMO context)
CREATE POLICY "Enable read access for all users" ON public.customers
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.customers
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.customers
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.customers
    FOR DELETE USING (true);


-- 2. Create OPPORTUNITIES Table
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE CASCADE,
    project_name VARCHAR(255) NOT NULL,
    service_type VARCHAR(100) NOT NULL, -- 'Testing Service', 'Equipment Rental', 'Manpower Supply', 'Engineering Service', 'Other'
    lead_source VARCHAR(100) NOT NULL,  -- 'Walk In', 'Call In', 'Call Out', 'Existing Customer', 'Referral', 'Connection', 'Website', 'Email Inquiry', 'Tender', 'Other'
    estimated_value NUMERIC(15, 2) DEFAULT 0.00,
    success_probability INT DEFAULT 0,  -- 0 to 100
    expected_close_date DATE,
    sales_person_id VARCHAR(50) NOT NULL,
    status VARCHAR(50) DEFAULT 'Lead',  -- 'Lead', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost', 'Cancelled'
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS for Opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Enable read access for all users" ON public.opportunities
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON public.opportunities
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON public.opportunities
    FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON public.opportunities
    FOR DELETE USING (true);


-- 3. INSERT SAMPLE DATA (Optional Seeding)
-- Note: Make sure to insert customers first then refer to their IDs in opportunities if manually seeding:

-- INSERT INTO public.customers (id, customer_code, customer_name, tax_id, industry_type, address, phone, email, payment_term, status, contacts)
-- VALUES 
-- ('c1ef4942-83b3-4f9e-bbb4-7a0df47a0001', 'CUS-000001', 'บริษัท ปตท. จำกัด (มหาชน)', '0107544000108', 'Energy & Utilities', '555 ถนนวิภาวดีรังสิต แขวงจตุจักร เขตจตุจักร กรุงเทพฯ 10900', '02-537-2000', 'info@pttplc.com', '30 Days', 'Active', '[{"contact_name": "สมชาย รักดี", "position": "Procurement Specialist", "phone": "081-234-5678", "email": "somchai.r@pttplc.com"}]'::jsonb);

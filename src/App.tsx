import React, { useState, useEffect } from 'react';
import { Customer, Opportunity, OpportunityStatus, UserRole, Quotation, SalesOrder, DeliveryJob, Invoice, Receipt } from './types';
import { CRMService, getConnectivityMode } from './supabaseService';
import DashboardView from './components/DashboardView';
import CustomerView from './components/CustomerView';
import OpportunityView from './components/OpportunityView';
import KanbanView from './components/KanbanView';
import ReportView from './components/ReportView';
import SetupView from './components/SetupView';
import ContactPersonView from './components/ContactPersonView';
import AdministrationView from './components/AdministrationView';
import QuotationView from './components/QuotationView';
import SalesOrderView from './components/SalesOrderView';
import DeliveryMonitoringView from './components/DeliveryMonitoringView';
import DeliveryView from './components/DeliveryView';
import InvoiceView from './components/InvoiceView';
import ReceiptView from './components/ReceiptView';
import { 
  Building2, 
  Target, 
  LayoutDashboard, 
  BarChart4, 
  Settings, 
  ShieldCheck, 
  AlertTriangle,
  Menu,
  ChevronRight,
  Database,
  CloudLightning,
  Sparkles,
  Layers,
  ChevronDown,
  Moon,
  Sun,
  X,
  Users,
  Shield,
  History,
  Lock,
  ArrowRightLeft,
  Plus,
  FileText,
  Briefcase,
  Truck,
  FileSpreadsheet,
  Wallet,
  ClipboardList
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'customers', 'opportunities', 'reports', 'setup'
  const [oppSubView, setOppSubView] = useState<'list' | 'kanban'>('list'); // Switch between Table and Pipeline Board inside Opportunities

  // Role Simulation & User Sessions
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    return (localStorage.getItem('crm_active_role') as UserRole) || 'System Administrator';
  });
  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    return localStorage.getItem('crm_active_user_id') || '3'; // '3' is Tanapol (System Administrator)
  });

  const handleUpdateSession = (userId: string, role: UserRole) => {
    setCurrentUserId(userId);
    setCurrentRole(role);
    localStorage.setItem('crm_active_user_id', userId);
    localStorage.setItem('crm_active_role', role);
  };

  // State Collections
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [deliveryJobs, setDeliveryJobs] = useState<DeliveryJob[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Connection and Toast notification
  const [isCloudConnected, setIsCloudConnected] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'err' } | null>(null);

  // Dark Mode toggles
  const [darkMode, setDarkMode] = useState(false);

  // Trigger Toast Notification
  const showToast = (text: string, type: 'success' | 'err') => {
    setToastMsg({ text, type });
    setTimeout(() => {
      setToastMsg(null);
    }, 4500);
  };

  // 1. Fetch Remote or fallback local state data
  const loadAllData = async () => {
    setLoading(true);
    try {
      const conn = await CRMService.checkCloudConnection();
      setIsCloudConnected(conn);

      const custs = await CRMService.fetchCustomers();
      setCustomers(custs);

      const opps = await CRMService.fetchOpportunities();
      setOpportunities(opps);

      const quotes = await CRMService.fetchQuotations();
      setQuotations(quotes);

      const sos = await CRMService.fetchSalesOrders();
      setSalesOrders(sos);

      const jobs = await CRMService.fetchDeliveryJobs();
      setDeliveryJobs(jobs);

      const invs = await CRMService.fetchInvoices();
      setInvoices(invs);

      const recs = await CRMService.fetchReceipts();
      setReceipts(recs);

      const projs = await (CRMService as any).fetchProjects();
      setProjects(projs);
    } catch (err) {
      console.warn('Failed loading data from standard adapters', err);
      showToast('ไม่สามารถดึงข้อมูลจากโครงข่ายได้ ระบบใช้ข้อมูลสำรอง', 'err');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // --- Audit Trail Logging proxy ---
  const logSystemAction = async (action: string, target_type: 'customer' | 'opportunity' | 'contact' | 'task' | 'attachment' | 'system', target_id: string, details: string) => {
    try {
      const simUsers = JSON.parse(localStorage.getItem('crm_sim_users') || '[]');
      const defaultActor = simUsers.find((u: any) => u.id === currentUserId) || { name: 'ผู้ดูแลระบบ ดลภัทร (Admin)', email: 'admin@crm.com' };
      await CRMService.insertAuditLog({
        action_by: `${defaultActor.name} (${defaultActor.email})`,
        role: currentRole,
        action,
        target_type,
        target_id,
        details
      });
    } catch (err) {
      console.warn('Failed inserting audit trail:', err);
    }
  };

  // 2. Main API mutations
  // --- Customers CRUD ---
  const handleAddCustomer = async (custPayload: Omit<Customer, 'id' | 'customer_code'>) => {
    setLoading(true);
    try {
      const newCust = await CRMService.insertCustomer(custPayload);
      showToast(`บันทึกข้อมูลองค์กร "${custPayload.customer_name}" ลงคลาวด์สำเร็จ`, 'success');
      await loadAllData();
      await logSystemAction(
        'สร้างข้อมูลลูกค้าใหม่ (Create Customer)', 
        'customer', 
        newCust?.id || 'new', 
        `เพิ่มลูกค้าองค์กร "${custPayload.customer_name}" ตลาดอุตสาหกรรม: ${custPayload.industry_type || '-'} โดยใช้สิทธิ์ในเซสชัน`
      );
    } catch (e: any) {
      await loadAllData();
      showToast(`บันทึกสำเร็จทางโลคอล ⚠️ คลาวด์ปฏิเสธ: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCustomer = async (id: string, updates: Partial<Customer>) => {
    setLoading(true);
    try {
      await CRMService.updateCustomer(id, updates);
      showToast('อัปเดตรายละเอียดกลุ่มลูกค้าลงคลาวด์สำเร็จ', 'success');
      await loadAllData();
      const targetCust = customers.find(c => c.id === id);
      await logSystemAction(
        'แก้ไขข้อมูลบริษัทลูกค้า (Update Customer)', 
        'customer', 
        id, 
        `อัปเดตรายละเอียดบริษัท "${updates.customer_name || targetCust?.customer_name || 'ลูกค้า'}" ฟิลด์ที่รับการแก้ไข: ${Object.keys(updates).join(', ')}`
      );
    } catch (e: any) {
      await loadAllData();
      showToast(`แก้ไขสำเร็จทางโลคอล ⚠️ คลาวด์ปฏิเสธ: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    setLoading(true);
    const targetCust = customers.find(c => c.id === id);
    try {
      await CRMService.deleteCustomer(id);
      showToast('ถอดถอนกลุ่มเป้าหมายข้อมูลคลาวด์เสร็จสิ้น', 'success');
      await loadAllData();
      await logSystemAction(
        'ลบข้อมูลลูกค้า (Delete Customer)', 
        'customer', 
        id, 
        `ถอดบริษัทลูกค้า "${targetCust?.customer_name || 'ลูกค้า'}" และผู้ประสานงานหลักทั้งหมดออกถาวร`
      );
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบสำเร็จทางโลคอล ⚠️ คลาวด์ปฏิเสธ: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  // --- Opportunities CRUD ---
  const handleAddOpportunity = async (oppPayload: Omit<Opportunity, 'id' | 'opportunity_no'>) => {
    setLoading(true);
    try {
      const newOpp = await CRMService.insertOpportunity(oppPayload);
      showToast(`สร้างเปิดโอกาสขาย "${oppPayload.project_name}" มูลค่า ฿${oppPayload.estimated_value.toLocaleString()} สำเร็จ`, 'success');
      await loadAllData();
      await logSystemAction(
        'สร้างโอกาสทางการขายใหม่ (Create Opportunity)', 
        'opportunity', 
        newOpp?.id || 'new', 
        `เพิ่มลีดดีลการค้า "${oppPayload.project_name}" มูลค่าประมาณ: ฿${(oppPayload.estimated_value || 0).toLocaleString()} คาดสัดส่วนสำเร็จ: ${oppPayload.success_probability}%`
      );
    } catch (e: any) {
      await loadAllData();
      showToast(`เพิ่มดีลสำเร็จระดับโลคอล ⚠️ คลาวด์ขัดข้อง: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOpportunity = async (id: string, updates: Partial<Opportunity>) => {
    setLoading(true);
    try {
      await CRMService.updateOpportunity(id, updates);
      showToast('การแก้ปรับปรุงสัดส่วนดีลโครงการค้าสำเร็จ', 'success');
      await loadAllData();
      const targetOpp = opportunities.find(o => o.id === id);
      await logSystemAction(
        'อัปเดตข้อมูลดีลโอกาสขาย (Update Opportunity)', 
        'opportunity', 
        id, 
        `แก้ไขเป้าหมายดีล "${updates.project_name || targetOpp?.project_name || 'ดีล'}" ฟิลด์ที่รับการแก้ไข: ${Object.keys(updates).join(', ')}`
      );
    } catch (e: any) {
      await loadAllData();
      showToast(`ปรับดีลสำเร็จทางออฟไลน์ ⚠️ คลาวด์ปฏิเสธ: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStatusChange = async (id: string, newStatus: OpportunityStatus) => {
    // Optimistic Update for smoother Drag animations in UI
    setOpportunities(prev => 
      prev.map(o => o.id === id ? { ...o, status: newStatus } : o)
    );
    try {
      await CRMService.updateOpportunity(id, { status: newStatus });
      const targetOpp = opportunities.find(o => o.id === id);
      await logSystemAction(
        'เปลี่ยนขั้นตอนโอกาสขาย (Kanban Drag Status)', 
        'opportunity', 
        id, 
        `ย้ายกระดานดีลงาน "${targetOpp?.project_name || 'ดีล'}" ไปสู่ระยะความคืบหน้าใหม่: [${newStatus}]`
      );
      // Reload underlyings
      const opps = await CRMService.fetchOpportunities();
      setOpportunities(opps);
    } catch (e: any) {
      // Reload underlyings safely
      const opps = await CRMService.fetchOpportunities();
      setOpportunities(opps);
      showToast(`การย้ายขั้นตอนสำเร็จทางโลคอล ⚠️ คลาวด์ปฏิเสธ: ${e.message}`, 'err');
    }
  };

  const handleDeleteOpportunity = async (id: string) => {
    setLoading(true);
    const targetOpp = opportunities.find(o => o.id === id);
    try {
      await CRMService.deleteOpportunity(id);
      showToast('ลบดีลโครงการดังกล่าวถาวรแล้ว', 'success');
      await loadAllData();
      await logSystemAction(
        'ลบดีลการค้า (Delete Opportunity)', 
        'opportunity', 
        id, 
        `ถอดชื่อดีลโครงการทางการค้า "${targetOpp?.project_name || 'ดีล'}" ออกจากสารระบบงานขายถาวร`
      );
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบดีลสำเร็จทางโลคอล ⚠️ คลาวด์ลบขัดข้อง: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  // --- Quotations CRUD ---
  const handleAddQuotation = async (payload: Omit<Quotation, 'id' | 'quotation_no' | 'created_at'>) => {
    setLoading(true);
    try {
      const result = await CRMService.insertQuotation(payload);
      showToast(`สร้างใบเสนอราคาใหม่สำเร็จ`, 'success');
      await loadAllData();
      await logSystemAction('สร้างใบเสนอราคา (Create Quotation)', 'system', result?.id || 'new', `ระบุหัวข้อ: ${payload.subject} ยอดเงิน: ฿${payload.grand_total.toLocaleString()}`);
    } catch (e: any) {
      await loadAllData();
      showToast(`เสร็จสมบูรณ์ระดับระบบ: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuotation = async (id: string, updates: Partial<Quotation>) => {
    setLoading(true);
    try {
      await CRMService.updateQuotation(id, updates);
      showToast(`อัปเดตใบเสนอราคาเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`อัปเดตสำเร็จทางโลคอล ⚠️ คลาวด์ปฏิเสธ: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuotation = async (id: string) => {
    setLoading(true);
    try {
      await CRMService.deleteQuotation(id);
      showToast(`ลบใบเสนอราคาเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  // --- Sales Orders CRUD ---
  const handleAddSalesOrder = async (payload: Omit<SalesOrder, 'id' | 'so_no' | 'created_at'>) => {
    setLoading(true);
    try {
      const result = await CRMService.insertSalesOrder(payload);
      showToast(`บันทึกใบสั่งขาย SO เรียบร้อย`, 'success');
      await loadAllData();
      await logSystemAction('สร้างใบสั่งขาย (Create Sales Order)', 'system', result?.id || 'new', `งาน: ${payload.project_name} ยอดเงิน: ฿${payload.total_amount.toLocaleString()}`);
    } catch (e: any) {
      await loadAllData();
      showToast(`ระงับบันทึกคลาวด์: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSalesOrder = async (id: string, updates: Partial<SalesOrder>) => {
    setLoading(true);
    try {
      await CRMService.updateSalesOrder(id, updates);
      showToast(`อัปเดตใบสั่งขายเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`อัปเดตสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSalesOrder = async (id: string) => {
    setLoading(true);
    try {
      await CRMService.deleteSalesOrder(id);
      showToast(`ลบใบสั่งขายเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  // --- Delivery Jobs CRUD ---
  const handleAddDeliveryJob = async (payload: Omit<DeliveryJob, 'id' | 'delivery_no' | 'created_at'>) => {
    setLoading(true);
    try {
      const result = await CRMService.insertDeliveryJob(payload);
      showToast(`บันทึกคิวจัดส่งพัสดุเรียบร้อย`, 'success');
      await loadAllData();
      await logSystemAction('สร้างแผนจัดส่งมอบวิศวกร (Create Delivery Job)', 'system', result?.id || 'new', `ผู้ดูแลหลัก: ${payload.delivered_by}`);
    } catch (e: any) {
      await loadAllData();
      showToast(`คลาวด์ขัดข้อง: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDeliveryJob = async (id: string, updates: Partial<DeliveryJob>) => {
    setLoading(true);
    try {
      await CRMService.updateDeliveryJob(id, updates);
      showToast(`ปรับปรุงแผนความคืบหน้าการส่งมอบเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`อัปเดตสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDeliveryJob = async (id: string) => {
    setLoading(true);
    try {
      await CRMService.deleteDeliveryJob(id);
      showToast(`ลบใบนำส่ง/แผนจัดงานเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  // --- Projects CRUD ---
  const handleAddProject = async (payload: Omit<any, 'id' | 'job_number' | 'created_at' | 'updated_at'>) => {
    setLoading(true);
    try {
      const result = await (CRMService as any).insertProject(payload);
      showToast('เปิดโครงการใหม่สำเร็จ', 'success');
      await loadAllData();
      await logSystemAction('สร้างโครงการใหม่ (Create Project)', 'system', result?.id || 'new', `ชื่อโครงการ: ${payload.project_name}`);
    } catch (e: any) {
      await loadAllData();
      showToast(`คลาวด์ขัดข้อง: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProject = async (id: string, updates: Partial<any>) => {
    setLoading(true);
    try {
      await (CRMService as any).updateProject(id, updates);
      showToast('อัปเดตข้อมูลโครงการสำเร็จ', 'success');
      await loadAllData();
      if (updates.status === 'Ready For Invoice') {
        const proj = projects.find(p => p.id === id);
        if (proj) {
          // Send notification / action when ready for invoice
          await logSystemAction('โครงการพร้อมแจ้งหนี้', 'system', id, `เปลี่ยนสถานะเป็นพร้อมวางบิล`);
        }
      }
    } catch (e: any) {
      await loadAllData();
      showToast(`อัปเดตสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setLoading(true);
    try {
      await (CRMService as any).deleteProject(id);
      showToast('ลบโครงการสำเร็จ', 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  // --- Invoices CRUD ---
  const handleAddInvoice = async (payload: Omit<Invoice, 'id' | 'invoice_no' | 'created_at'>) => {
    setLoading(true);
    try {
      const result = await CRMService.insertInvoice(payload);
      showToast(`ออกใบวางบิลเรียกเก็บเรียบร้อย`, 'success');
      await loadAllData();
      await logSystemAction('สร้างใบวางบิลเรียกเก็บ (Create Invoice)', 'system', result?.id || 'new', `ยอดชำระ: ฿${payload.grand_total.toLocaleString()}`);
    } catch (e: any) {
      await loadAllData();
      showToast(`ระงับบันทึกคลาวด์: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvoice = async (id: string, updates: Partial<Invoice>) => {
    setLoading(true);
    try {
      await CRMService.updateInvoice(id, updates);
      showToast(`แก้ไขข้อมูลใบวางบิลเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`อัปเดตสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInvoice = async (id: string) => {
    setLoading(true);
    try {
      await CRMService.deleteInvoice(id);
      showToast(`ยกเลิกถอนลบใบแจ้งหนี้เรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  // --- Receipts CRUD ---
  const handleAddReceipt = async (payload: Omit<Receipt, 'id' | 'receipt_no' | 'created_at'>) => {
    setLoading(true);
    try {
      const result = await CRMService.insertReceipt(payload);
      showToast(`ออกใบเสร็จรับเงินสำเร็จ`, 'success');
      
      // Auto update matched invoice status to PAID if matching or partially paid
      const matchedInv = invoices.find(inv => inv.id === payload.invoice_id);
      if (matchedInv) {
        let newStatus: 'Paid' | 'Partially Paid' = 'Paid';
        if (payload.received_amount < matchedInv.grand_total) {
          newStatus = 'Partially Paid';
        }
        await CRMService.updateInvoice(payload.invoice_id, { status: newStatus });
      }

      await loadAllData();
      await logSystemAction('ปิดรับบิลเงินและออกใบเสร็จ (Create Receipt)', 'system', result?.id || 'new', `ช่องทาง: ${payload.payment_method} รับสุทธิ: ฿${payload.received_amount.toLocaleString()}`);
    } catch (e: any) {
      await loadAllData();
      showToast(`ประมวลปิดงานสิทธิ์คลาวด์ล้มเหลว: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReceipt = async (id: string, updates: Partial<Receipt>) => {
    setLoading(true);
    try {
      await CRMService.updateReceipt(id, updates);
      showToast(`ปรับปรุงประวัติใบรับเงินเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`อัปเดตสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReceipt = async (id: string) => {
    setLoading(true);
    try {
      await CRMService.deleteReceipt(id);
      showToast(`ลบข้อมูลใบเสร็จรับเงินเรียบร้อย`, 'success');
      await loadAllData();
    } catch (e: any) {
      await loadAllData();
      showToast(`ลบสำเร็จทางโลคอล: ${e.message}`, 'err');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-800'}`}>
      
      {/* Top Professional Header Bar */}
      <header className="bg-white border-b border-slate-150 sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-xs print:hidden">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black shadow-sm shrink-0">
            C
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-600 tracking-wider flex items-center gap-1 leading-none">
              <Sparkles className="w-3 h-3 animate-pulse" />
              Corporate CRM Solution v1.0
            </span>
            <h1 className="text-base font-extrabold text-slate-800 tracking-tight leading-none mt-1">
              CRM SALES MANAGEMENT SYSTEM
            </h1>
          </div>
        </div>

        {/* Database connectivity dynamic visualizer */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-full select-none">
            <Database className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500"> adapter: </span>
            {isCloudConnected && getConnectivityMode() ? (
              <span className="text-[11px] font-bold text-green-700 bg-green-50 border border-green-150 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                <CloudLightning className="w-3 h-3 shrink-0" />
                SUPABASE CLOUD
              </span>
            ) : (
              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-mono flex items-center gap-0.5">
                LOCAL SANDBOX
              </span>
            )}
          </div>

          <button 
            onClick={() => setActiveTab('setup')}
            title="Database Setup Console"
            className="p-2 border border-slate-200 hover:bg-slate-50 focus:outline-none rounded-xl transition-all relative cursor-pointer"
          >
            <Settings className="w-5 h-5 text-slate-500" />
            {!isCloudConnected && getConnectivityMode() && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Structural Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Printable Section Shield */}
        <aside className="print:hidden w-64 border-r border-slate-150 bg-white shrink-0 hidden md:flex flex-col justify-between py-6">
          <div className="space-y-6">
            
            {/* Nav List */}
            <div className="px-4 space-y-1">
              <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">เมนูหลัก (SYSTEM)</span>
              
              {/* Dashboard Icon */}
              <button
                id="menu-dashboard"
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <LayoutDashboard className="w-4.5 h-4.5" />
                แดชบอร์ดหลัก
              </button>

              {/* Setup Icon */}
              <button
                id="menu-setup"
                onClick={() => setActiveTab('setup')}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'setup' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Database className="w-4.5 h-4.5" />
                ตั้งค่า Supabase / SQL
              </button>
            </div>

            {/* Customer Management Section */}
            <div className="px-4 space-y-0.5">
              <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">การจัดการลูกค้า (Customers)</div>
              
              <button
                id="menu-customer-master"
                onClick={() => setActiveTab('customers')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Building2 className="w-4.5 h-4.5 shrink-0" />
                Customer Master
              </button>

              <button
                id="menu-contact-person"
                onClick={() => setActiveTab('contacts')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'contacts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Users className="w-4.5 h-4.5 shrink-0" />
                Contact Person
              </button>
            </div>

            {/* Opportunity Management Section */}
            <div className="px-4 space-y-0.5">
              <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1 font-sans">จัดการดีลโครงการ (OPPORTUNITIES)</div>
              
              <button
                id="menu-opp-list"
                onClick={() => { setActiveTab('opportunities'); setOppSubView('list'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'opportunities' && oppSubView === 'list' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Target className="w-4.5 h-4.5 shrink-0" />
                Opportunity List
              </button>

              <button
                id="menu-opp-pipeline"
                onClick={() => { setActiveTab('opportunities'); setOppSubView('kanban'); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'opportunities' && oppSubView === 'kanban' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Layers className="w-4.5 h-4.5 shrink-0" />
                Opportunity Pipeline
              </button>
            </div>

            {/* Business Flows & Documents Section */}
            <div className="px-4 space-y-0.5">
              <div className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">ฝ่ายเอกสารและงานบริการ (Workflows)</div>
              
              <button
                id="menu-quotations"
                onClick={() => setActiveTab('quotations')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'quotations' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <FileText className="w-4.5 h-4.5 shrink-0" />
                Quotation Management
              </button>

              <button
                id="menu-salesorders"
                onClick={() => setActiveTab('salesOrders')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'salesOrders' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Briefcase className="w-4.5 h-4.5 shrink-0" />
                Sales Order & Jobs
              </button>

              <button
                id="menu-projects"
                onClick={() => setActiveTab('projects')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'projects' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <ClipboardList className="w-4.5 h-4.5 shrink-0" />
                Delivery & Ongoing Jobs
              </button>

              <button
                id="menu-deliveries"
                onClick={() => setActiveTab('deliveryJobs')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'deliveryJobs' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Truck className="w-4.5 h-4.5 shrink-0" />
                Delivery Tracking
              </button>

              <button
                id="menu-invoices"
                onClick={() => setActiveTab('invoices')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'invoices' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <FileSpreadsheet className="w-4.5 h-4.5 shrink-0" />
                Invoice Management
              </button>

              <button
                id="menu-receipts"
                onClick={() => setActiveTab('receipts')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'receipts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Wallet className="w-4.5 h-4.5 shrink-0" />
                Receipts & Income
              </button>
            </div>

            {/* Reports & Administration Section */}
            <div className="px-4 space-y-0.5">
              <span className="px-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">ความปลอดภัยและรายงานสรุป</span>
              
              <button
                id="menu-report"
                onClick={() => setActiveTab('reports')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <BarChart4 className="w-4.5 h-4.5 shrink-0" />
                รายงานผลวิเคราะห์คู่ค้า
              </button>

              <button
                id="menu-admin"
                onClick={() => setActiveTab('administration')}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all focus:outline-none cursor-pointer ${activeTab === 'administration' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'}`}
              >
                <Shield className="w-4.5 h-4.5 shrink-0" />
                ระบบสิทธิ์และ Audit Trail
              </button>
            </div>

          </div>

          {/* Footer of Sidebar */}
          <div className="px-6 space-y-3">
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center select-none font-mono">
              <span className="text-[9px] text-slate-400 block font-bold">CURRENT SESSION ROLE</span>
              <span className="text-[10px] text-emerald-600 font-extrabold mt-0.5 inline-block bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {currentRole}
              </span>
            </div>
            <div className="text-[9px] text-slate-400 text-center">
              CRM Sales Management System
              <div>© 2026 Corporate Portal v1.5</div>
            </div>
          </div>
        </aside>

        {/* Portable Mobile Header Drawer (Triggered automatically on small screens) */}
        <div className="md:hidden print:hidden fixed bottom-1 left-0 right-0 p-2 bg-white/95 border-t border-slate-200/80 backdrop-blur-md z-40 flex items-center justify-around text-slate-500 text-[10px] font-bold shadow-lg">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 focus:outline-none ${activeTab === 'dashboard' ? 'text-blue-600 font-extrabold' : ''}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            สรุปยอด
          </button>
          
          <button 
            onClick={() => setActiveTab('customers')}
            className={`flex flex-col items-center gap-1 p-2 focus:outline-none ${activeTab === 'customers' ? 'text-blue-600 font-extrabold' : ''}`}
          >
            <Building2 className="w-5 h-5 shrink-0" />
            ลูกค้า
          </button>

          <button 
            onClick={() => { setActiveTab('opportunities'); setOppSubView('list'); }}
            className={`flex flex-col items-center gap-1 p-2 focus:outline-none ${activeTab === 'opportunities' ? 'text-blue-600 font-extrabold' : ''}`}
          >
            <Target className="w-5 h-5 shrink-0" />
            ข้อมูลขาย
          </button>

          {activeTab === 'opportunities' && (
            <button 
              onClick={() => setOppSubView(oppSubView === 'list' ? 'kanban' : 'list')}
              className="flex flex-col items-center gap-1 p-2 text-indigo-600 focus:outline-none"
            >
              <Layers className="w-5 h-5 shrink-0" />
              {oppSubView === 'list' ? 'ไปป์ไลน์' : 'ตาราง'}
            </button>
          )}

          <button 
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 p-2 focus:outline-none ${activeTab === 'reports' ? 'text-blue-600 font-extrabold' : ''}`}
          >
            <BarChart4 className="w-5 h-5 shrink-0" />
            รายงาน
          </button>
        </div>

        {/* Center Canvas Area wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 print:p-0">
          
          {/* Main App Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-3xs flex items-center justify-center z-50 print:hidden animate-fade-in">
              <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-slate-150">
                <div className="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <div className="space-y-0.5 text-sm font-semibold text-slate-800">
                  <span>กำลังเรียกประมวลผลข้อมูล...</span>
                  <span className="text-xs text-slate-400 block font-normal">กรุณาถือรอสักครู่ ระบบกำลังสื่อสารกับฐานข้อมูล</span>
                </div>
              </div>
            </div>
          )}

          {/* Actual Tab routers */}
          <div className="animate-fade-in duration-300">
            {activeTab === 'dashboard' && (
              <DashboardView 
                customers={customers} 
                opportunities={opportunities} 
                onNavigate={(tab) => {
                  if (tab === 'opportunities') {
                    setActiveTab('opportunities');
                    setOppSubView('list');
                  } else {
                    setActiveTab(tab);
                  }
                }}
              />
            )}

            {activeTab === 'customers' && (
              <CustomerView 
                customers={customers}
                opportunities={opportunities}
                onAdd={handleAddCustomer}
                onUpdate={handleUpdateCustomer}
                onDelete={handleDeleteCustomer}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'contacts' && (
              <ContactPersonView 
                customers={customers}
                currentRole={currentRole}
                currentUserId={currentUserId}
                onUpdateCustomer={handleUpdateCustomer}
                onToast={showToast}
                onViewCustomer={(cust) => {
                  setActiveTab('customers');
                }}
              />
            )}

            {activeTab === 'opportunities' && oppSubView === 'list' && (
              <OpportunityView 
                opportunities={opportunities}
                customers={customers}
                onAdd={handleAddOpportunity}
                onUpdate={handleUpdateOpportunity}
                onDelete={handleDeleteOpportunity}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'opportunities' && oppSubView === 'kanban' && (
              <KanbanView 
                opportunities={opportunities}
                onStatusChange={handleDragStatusChange}
                onSelectOpp={(opp) => {
                  setOppSubView('list');
                  // Provide view toggle directly
                  showToast(`เปิดดูดีล ${opp.opportunity_no} เพื่อดูสิทธิ์ออกเอกสาร`, 'success');
                }}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'reports' && (
              <ReportView 
                customers={customers}
                opportunities={opportunities}
                onToast={showToast}
              />
            )}

            {activeTab === 'quotations' && (
              <QuotationView
                quotations={quotations}
                customers={customers}
                opportunities={opportunities}
                onAdd={handleAddQuotation}
                onUpdate={handleUpdateQuotation}
                onDelete={handleDeleteQuotation}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'salesOrders' && (
              <SalesOrderView
                salesOrders={salesOrders}
                quotations={quotations}
                customers={customers}
                onAdd={handleAddSalesOrder}
                onUpdate={handleUpdateSalesOrder}
                onDelete={handleDeleteSalesOrder}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'projects' && (
              <DeliveryMonitoringView
                projects={projects}
                salesOrders={salesOrders}
                customers={customers}
                onAdd={handleAddProject}
                onUpdate={handleUpdateProject}
                onDelete={handleDeleteProject}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'deliveryJobs' && (
              <DeliveryView
                deliveryJobs={deliveryJobs}
                salesOrders={salesOrders}
                customers={customers}
                onAdd={handleAddDeliveryJob}
                onUpdate={handleUpdateDeliveryJob}
                onDelete={handleDeleteDeliveryJob}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoiceView
                invoices={invoices}
                salesOrders={salesOrders}
                customers={customers}
                onAdd={handleAddInvoice}
                onUpdate={handleUpdateInvoice}
                onDelete={handleDeleteInvoice}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'receipts' && (
              <ReceiptView
                receipts={receipts}
                invoices={invoices}
                customers={customers}
                onAdd={handleAddReceipt}
                onUpdate={handleUpdateReceipt}
                onDelete={handleDeleteReceipt}
                onToast={showToast}
                currentRole={currentRole}
                currentUserId={currentUserId}
              />
            )}

            {activeTab === 'administration' && (
              <AdministrationView 
                currentRole={currentRole}
                currentUserId={currentUserId}
                onChangeUserSession={handleUpdateSession}
                onToast={showToast}
              />
            )}

            {activeTab === 'setup' && (
              <SetupView onToast={showToast} onConnectivityChange={loadAllData} />
            )}
          </div>

        </main>

      </div>

      {/* --- FLOATING TOAST NOTIFICATION PRESET --- */}
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] max-w-sm w-full bg-white rounded-2xl border shadow-xl p-4 flex items-start gap-3 transition-all transform animate-slide-left print:hidden">
          <div className={`p-2 rounded-xl shrink-0 ${toastMsg.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-0.5 text-sm flex-1">
            <span className="font-bold text-slate-800">การแจ้งเตือนระบบ</span>
            <p className="text-xs text-slate-500 leading-relaxed font-sans">{toastMsg.text}</p>
          </div>
          <button 
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-slate-600 p-1 focus:outline-none"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

    </div>
  );
}

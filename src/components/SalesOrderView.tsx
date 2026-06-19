import React, { useState, useMemo } from 'react';
import { Customer, Quotation, SalesOrder, UserRole } from '../types';
import { Briefcase, Plus, Search, Filter, Trash2, Eye, Printer, Edit2, FileText, Check, Calendar, Settings2, ShieldAlert, X } from 'lucide-react';

interface SalesOrderViewProps {
  salesOrders: SalesOrder[];
  quotations: Quotation[];
  customers: Customer[];
  onAdd: (payload: Omit<SalesOrder, 'id' | 'so_no' | 'created_at'>) => Promise<any>;
  onUpdate: (id: string, updates: Partial<SalesOrder>) => Promise<any>;
  onDelete: (id: string) => Promise<any>;
  onToast: (msg: string, type: 'success' | 'err') => void;
  currentRole: UserRole;
  currentUserId: string;
}

export default function SalesOrderView({
  salesOrders,
  quotations,
  customers,
  onAdd,
  onUpdate,
  onDelete,
  onToast,
  currentRole,
  currentUserId
}: SalesOrderViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSO, setEditingSO] = useState<SalesOrder | null>(null);
  const [viewingSO, setViewingSO] = useState<SalesOrder | null>(null);

  // Form State
  const [quoteId, setQuoteId] = useState('');
  const [custId, setCustId] = useState('');
  const [projectName, setProjectName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });
  const [status, setStatus] = useState<'Pending' | 'Planning' | 'In Progress' | 'Completed' | 'Cancelled'>('Pending');

  const canModify = currentRole !== 'Management';
  const canDelete = currentRole === 'Sales Manager' || currentRole === 'Admin' || currentRole === 'System Administrator';

  // Extract only Approved/Sent quotations to create Sales Orders
  const validQuotations = useMemo(() => {
    return quotations.filter(q => q.status === 'Approved' || q.status === 'Sent');
  }, [quotations]);

  const handleQuoteChange = (id: string) => {
    setQuoteId(id);
    const q = quotations.find(item => item.id === id);
    if (q) {
      setCustId(q.customer_id);
      setProjectName(q.subject);
      setTotalAmount(q.total_amount);
    }
  };

  const handleOpenAddForm = () => {
    setEditingSO(null);
    setQuoteId('');
    setCustId('');
    setProjectName('');
    setTotalAmount(0);
    setOrderDate(new Date().toISOString().split('T')[0]);
    const d = new Date();
    d.setDate(d.getDate() + 60);
    setTargetDeliveryDate(d.toISOString().split('T')[0]);
    setStatus('Pending');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (so: SalesOrder) => {
    setEditingSO(so);
    setQuoteId(so.quotation_id);
    setCustId(so.customer_id);
    setProjectName(so.project_name);
    setTotalAmount(so.total_amount);
    setOrderDate(so.order_date);
    setTargetDeliveryDate(so.target_delivery_date);
    setStatus(so.status);
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custId || !projectName || totalAmount <= 0) {
      onToast('กรุณากรอกข้อมูลลูกค้า ชื่อโครงการ และยอดเงินเป้าหมายให้ครบถ้วน', 'err');
      return;
    }

    const payload = {
      quotation_id: quoteId,
      customer_id: custId,
      project_name: projectName,
      total_amount: Number(totalAmount),
      status,
      order_date: orderDate,
      target_delivery_date: targetDeliveryDate
    };

    try {
      if (editingSO) {
        await onUpdate(editingSO.id, payload);
        onToast(`แก้ไขใบสั่งสั่งขาย ${editingSO.so_no} ลงระบบเรียบร้อย`, 'success');
      } else {
        await onAdd(payload);
        onToast(`สร้างบันทึกใบสั่งขาย (Sales Order) ใหม่สำเร็จ`, 'success');
      }
      setIsFormOpen(false);
    } catch {
      onToast('เกิดข้อผิดพลาดในการเชื่อมต่อคลาวด์/จัดเก็บข้อมูล', 'err');
    }
  };

  const filteredSalesOrders = useMemo(() => {
    return salesOrders.filter(so => {
      const matchSearch = 
        so.so_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        so.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (so.customer_name && so.customer_name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = selectedStatus === 'All' || so.status === selectedStatus;
      return matchSearch && matchStatus;
    });
  }, [salesOrders, searchTerm, selectedStatus]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="salesorder-module">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-150 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Sales Order Management (ออกใบสั่งขายและ Job งานจ้าง)</h2>
            <p className="text-xs text-slate-400 mt-1 font-medium">โมดูลที่ 5: จัดการใบสั่งงาน คอนเฟิร์มดีลโครงการค้าขาย และเริ่มจัดแผนโครงสร้างปฏิบัติการ</p>
          </div>
        </div>
        {canModify && (
          <button
            onClick={handleOpenAddForm}
            className="flex items-center justify-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all cursor-pointer shadow-xs text-sm"
          >
            <Plus className="w-4 h-4" />
            เปิดใบสั่งขาย SO / New Sales Order
          </button>
        )}
      </div>

      {/* filter tools */}
      <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
          <input
            type="text"
            placeholder="ค้นหาเลขที่ใบสั่งขาย SO, ชื่อโปรเจกต์งาน, ผู้ประสานงาน หรือยริษัทลูกค้า..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/25 transition-all"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="text-slate-400 w-4 h-4 shrink-0" />
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full md:w-48 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/25 cursor-pointer font-bold"
          >
            <option value="All">ทุกสถานะใบสั่งขาย</option>
            <option value="Pending">Pending</option>
            <option value="Planning">Planning</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Spreadsheet Tab simulation bar */}
      <div className="bg-[#f8f9fa] border border-slate-200 border-b-0 px-4 py-2 flex items-center justify-between text-xs select-none rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="font-medium bg-[#E8EAED] px-2.5 py-1 rounded border border-slate-200 text-slate-700 select-none">Sheet1</span>
          <span className="text-slate-400">|</span>
          <span className="font-mono font-semibold text-emerald-600">{filteredSalesOrders.length} แถว (Rows)</span>
        </div>
      </div>

      {/* Main Grid table in Google Sheet style */}
      <div className="bg-white rounded-b-2xl border border-[#DADCE0] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              {/* Excel Column Headers A, B, C... */}
              <tr className="bg-[#F8F9FA] border-b border-slate-250 text-[10px] font-mono text-slate-400 select-none">
                <th className="border border-slate-200 bg-[#E8EAED] text-center w-10 py-1"></th>
                <th className="border border-slate-200 text-center w-40">A</th>
                <th className="border border-slate-200 text-center">B</th>
                <th className="border border-slate-200 text-center w-44">C</th>
                <th className="border border-slate-200 text-center w-44">D</th>
                <th className="border border-slate-200 text-center w-36">E</th>
                <th className="border border-slate-200 text-center w-36">F</th>
              </tr>
              {/* Header Columns inside the spreadsheet */}
              <tr className="bg-[#F8F9FA] border-b-2 border-slate-300 text-xs font-semibold text-slate-600">
                <th className="border border-slate-200 bg-[#E8EAED] text-center w-10 font-mono select-none"></th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">รหัสใบสั่งขาย</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">แคมเปญโครงการ / บริษัทคู่ค้า</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">มูลค่างบประมาณรวม</th>
                <th className="border border-slate-200 px-3 py-2 text-slate-700">วันที่รับจ้าง / กำหนดสำเร็จ</th>
                <th className="border border-slate-200 px-3 py-2 text-center text-slate-700">คิวสถานะ</th>
                <th className="border border-slate-200 px-3 py-2 text-right text-slate-700">การสั่งการ</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-700">
              {filteredSalesOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs border border-slate-200">
                    ไม่พบข้อมูลประวัติใบสั่งสั่งขายทางการค้าในรอบพอร์ทัล
                  </td>
                </tr>
              ) : (
                filteredSalesOrders.map((so, idx) => (
                  <tr 
                    key={so.id} 
                    className={`hover:bg-blue-50/45 cursor-pointer transition-colors border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#F8F9FA]/70'}`}
                  >
                    {/* Index row background (spreadsheet numbering) */}
                    <td className="border border-slate-200 bg-[#F1F3F4] text-[#5f6368] text-center font-mono text-[10px] select-none py-1.5">
                      {idx + 1}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 font-mono font-bold text-slate-800">
                      {so.so_no}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <span className="font-extrabold text-slate-800 block">{so.project_name}</span>
                      <span className="text-xs text-slate-400 font-normal">ลูกค้า: {so.customer_name}</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right font-mono font-bold text-slate-900">
                      ฿{so.total_amount.toLocaleString()}
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5">
                      <span className="text-xs block text-slate-600 font-bold">เริ่ม: {so.order_date}</span>
                      <span className="text-[10px] text-teal-600 block font-semibold mt-0.5">แผนเสร็จ: {so.target_delivery_date}</span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold leading-none ${
                        so.status === 'Completed' ? 'bg-green-50 text-green-700 border border-green-150' :
                        so.status === 'In Progress' ? 'bg-indigo-50 text-indigo-700 border border-indigo-150' :
                        so.status === 'Planning' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                        so.status === 'Cancelled' ? 'bg-rose-50 text-rose-700 border border-rose-150' :
                        'bg-slate-50 text-slate-600 border border-slate-200'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                    <td className="border border-slate-200 px-3 py-1.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setViewingSO(so)}
                          title="ดูแบบฟอร์มเชิงลึก / พิมพ์ใบสั่งงาน"
                          className="p-1 text-slate-500 hover:text-teal-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canModify && (
                          <button
                            onClick={() => handleOpenEditForm(so)}
                            title="แก้ไขขั้นตอนหรือวันกำหนดการ"
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={async () => {
                              if (confirm(`คุณแน่ใจว่าต้องการยกเลิกและลบประวัติใบสั่งขาย ${so.so_no} หรือไม่?`)) {
                                await onDelete(so.id);
                                onToast('ถอดถอนลบข้อมูลใบสั่งขายเรียบร้อย', 'success');
                              }
                            }}
                            title="ลบข้อมูล"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal Form */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-3xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden animate-slide-up">
            <div className="bg-slate-50 p-6 border-b border-slate-150 flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-800">
                  {editingSO ? `ปรับขั้นตอนการทำงานใบสั่งจ้าง SO: ${editingSO.so_no}` : 'ขึ้นทะเบียนใบสั่งขาย Sales Order (รับมอบงาน)'}
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">บันทึกข้อตกลงงานวิศวกรรมเฉพาะทาง หรือจัดหาทรัพยากรกำลังคน</p>
              </div>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 rounded bg-white border border-slate-150">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Quotation Ref */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">อ้างอิงใบเสนอราคาที่ได้รับอนุมัติ *</label>
                <select
                  required
                  value={quoteId}
                  onChange={(e) => handleQuoteChange(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">-- เลือกอ้างอิงใบเสนอราคาคู่ชำระ --</option>
                  {validQuotations.map(q => (
                    <option key={q.id} value={q.id}>{q.quotation_no} - {q.subject}</option>
                  ))}
                </select>
              </div>

              {/* Customer selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">องค์กรลูกค้าหลัก</label>
                <select
                  required
                  disabled={!!quoteId}
                  value={custId}
                  onChange={(e) => setCustId(e.target.value)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none cursor-not-allowed"
                >
                  <option value="">-- จะดึงบริษัทอิงตามข้อมูลเสนอราคา --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>{c.customer_name}</option>
                  ))}
                </select>
              </div>

              {/* Project name input */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">ชื่อแคมเปญโครงการ/งานบริการที่ระบุ *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น โครงการตรวจแก้หม้อแก๊สโรงไฟฟ้า PTT"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Amount and Status and Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">ยอดงบประมาณจัดจ้าง (฿) *</label>
                  <input
                    type="number"
                    required
                    placeholder="เช่น 1200000"
                    value={totalAmount || ''}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">รหัสคิวสถานะดีลงาน</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">วันที่ตกลงสั่งจ้าง / Order Date</label>
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">กำหนดส่งมอบแผนงาน / Delivery Date</label>
                  <input
                    type="date"
                    required
                    value={targetDeliveryDate}
                    onChange={(e) => setTargetDeliveryDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="bg-slate-50 border border-slate-200 text-slate-600 font-bold px-5 py-2 rounded-xl text-xs hover:bg-slate-100 transition-all"
                >
                  ออก
                </button>
                <button
                  type="submit"
                  className="bg-teal-600 text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-teal-700 shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  อนุมัติคำสั่งสั่งขาย / Issue SO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visual Printed Sales Order Doc Modal */}
      {viewingSO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-3xs flex items-center justify-center z-50 p-4 overflow-y-auto animate-fade-in print:bg-white print:p-0 print:absolute">
          <div className="bg-white rounded-2xl shadow-3xl w-full max-w-3xl overflow-hidden my-8 animate-scale-up print:shadow-none print:my-0 print:rounded-none">
            
            {/* Header control toolbar (Hidden in print) */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between print:hidden">
              <span className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                <Printer className="w-4.5 h-4.5 text-teal-600" />
                ใบสั่งจ้างปาดและรับงาน / Original Sales Order View ({viewingSO.so_no})
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-4 rounded-lg text-xs transition-all cursor-pointer flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  พิมพ์แบบฟอร์มใบงาน
                </button>
                <button onClick={() => setViewingSO(null)} className="p-1 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print canvas page */}
            <div className="p-8 md:p-12 space-y-8 font-sans bg-white print:p-0 text-slate-800">
              
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-teal-600 font-extrabold text-2xl tracking-tight uppercase leading-none">SALES ORDER</h1>
                  <span className="text-xs text-slate-400 block mt-1">ใบสั่งจ้างและบันทึกข้อตกลงงานบริการวิศวกรรม</span>
                  <div className="text-xs font-medium text-slate-700 mt-4 leading-relaxed font-mono">
                    <strong>บริษัท ควอลิที เทค แอนด์ เซอร์วิส จำกัด</strong><br />
                    1024/9 อาคารศูนย์ไอทีอาร์ สาทร พญาไท กรุงเทพมหานคร 10400<br />
                    ทะเบียนประจำตัวผู้เสียภาษีอากร: 0105658091234
                  </div>
                </div>
                <div className="text-right space-y-1 text-xs">
                  <div className="text-[11px] font-bold text-slate-400">เลขที่ใบสั่งขาย / SO Identifier</div>
                  <div className="font-mono text-base font-extrabold text-slate-800">{viewingSO.so_no}</div>
                  <div className="text-[11px] font-bold text-slate-400 pt-2">อ้างอิงใบเสนอราคา / Quote Ref.</div>
                  <div className="font-mono text-xs font-bold text-slate-600">{quotations.find(q => q.id === viewingSO.quotation_id)?.quotation_no || 'ไม่พบการอ้างอิงแยก'}</div>
                  <div className="text-[11px] font-bold text-slate-400 pt-2">ลงวันที่เริ่มรับงาน / Date Assigned</div>
                  <div className="font-bold">{viewingSO.order_date}</div>
                </div>
              </div>

              {/* Addresses section */}
              <div className="grid grid-cols-2 gap-8 text-xs">
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                  <div className="text-[11px] uppercase font-bold text-slate-400 mb-1.5">บริษัทผู้ว่าจ้าง / Account Entity:</div>
                  <div className="text-slate-800 font-extrabold text-sm">{viewingSO.customer_name}</div>
                  <div className="text-slate-500 mt-2 leading-relaxed">
                    เลขผู้เสียภาษี: {customers.find(c => c.id === viewingSO.customer_id)?.tax_id || '-'}<br />
                    เครดิตเทอม: {customers.find(c => c.id === viewingSO.customer_id)?.payment_term || '30 วันการค้า'}<br />
                    วงเงินความร่วมมือสูงสุด: ฿{(customers.find(c => c.id === viewingSO.customer_id)?.credit_limit || 0).toLocaleString()} บาท
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <div className="text-[11px] uppercase font-bold text-slate-400 mb-1">เป้าหมายงบประมาณการตรวจสอบ / Deliverables:</div>
                  <div className="text-xs text-slate-700 font-bold">{viewingSO.project_name}</div>
                  <div className="text-[11.5px] leading-relaxed text-slate-500 mt-2">
                    กำหนดขอบเขตจัดส่งรายงาน: <strong>{viewingSO.target_delivery_date}</strong><br />
                    ระเบียบประกันภัย: กำหนดให้พนักงานที่จัดส่งไปต้องสวมหมวกนิรภัย (PPE Standard) ตลอดความร่วมมือในพื้นที่โรงงานควบคุม
                  </div>
                </div>
              </div>

              {/* Items Summary list */}
              <table className="w-full text-xs text-left border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-bold uppercase text-slate-600">
                    <th className="px-4 py-2.5">รายการลักษณะงานรับจ้างการค้า / Project Milestones</th>
                    <th className="px-4 py-2.5 text-right w-56">กำหนดแล้วเสร็จเป้าหมาย / Duration</th>
                    <th className="px-4 py-2.5 text-right w-44">ยอดเงินงบประมาณ (฿)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  <tr>
                    <td className="px-4 py-4">
                      <span className="font-bold text-slate-800 block">{viewingSO.project_name}</span>
                      <span className="text-[10px] text-slate-400 block mt-1">อิงตามข้อตกลงและเงื่อนไขเทคนิคหลักของใบเสนอเลขรหัส {viewingSO.quotation_id}</span>
                    </td>
                    <td className="px-4 py-4 text-right">ภายใน {viewingSO.target_delivery_date}</td>
                    <td className="px-4 py-4 text-right font-mono font-extrabold text-teal-700">฿{viewingSO.total_amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              {/* Signatures execution */}
              <div className="grid grid-cols-2 gap-12 pt-20 text-center text-xs">
                <div className="space-y-12">
                  <span className="text-slate-400 font-medium block">จัดแผนคิวบริการโดย / Project Planner:</span>
                  <div className="border-b border-slate-300 w-48 mx-auto pb-1 text-slate-700 font-semibold">
                    ( ทีมวิศวกรผู้ดูแลระบบคิว )
                  </div>
                  <span className="text-[10px] text-slate-400 block">วันที่ / Date: ............................................</span>
                </div>
                <div className="space-y-12">
                  <span className="text-slate-400 font-medium block">ตัวแทนผู้มีอำนาจเซ็นต์รับทราบใบงาน / Auth Representative:</span>
                  <div className="border-b border-slate-300 w-48 mx-auto pb-1 text-slate-700 font-semibold">
                    ...........................................................................
                  </div>
                  <span className="text-[10px] text-slate-400 block">วันที่ / Date: ............................................</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

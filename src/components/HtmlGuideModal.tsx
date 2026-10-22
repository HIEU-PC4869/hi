import React from 'react';

interface HtmlGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HtmlGuideModal: React.FC<HtmlGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handleDownloadAppHtml = async () => {
    try {
      const response = await fetch('/app.html');
      const text = await response.text();
      const blob = new Blob([text], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'app.html';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open('/app.html', '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-2xl bg-[#141c2e] border border-[#7dd3fc]/30 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#a0b4c4] hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0e4d6e]/40 border border-[#7dd3fc]/40 flex items-center justify-center text-[#7dd3fc]">
            <span className="material-symbols-outlined text-2xl">html</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Giao diện HTML Chạy Trên VS Code
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                100% Không Lỗi
              </span>
            </h2>
            <p className="text-xs text-[#a0b4c4]">
              Không cần cài đặt thư viện nặng như PySide6 hay Qt! Chạy mượt mà trên mọi máy tính.
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <a
            href="/app.html"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-[#0e4d6e] to-[#7dd3fc] text-[#001f2e] font-bold text-xs shadow-lg shadow-[#7dd3fc]/15 hover:opacity-95 transition-all"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            <span>Mở ngay trên trình duyệt (/app.html)</span>
          </a>

          <button
            onClick={handleDownloadAppHtml}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1a2438] hover:bg-[#202c42] text-[#7dd3fc] border border-[#7dd3fc]/30 font-bold text-xs transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span>Tải file app.html về máy</span>
          </button>
        </div>

        {/* 3 Simple Run Methods in VS Code */}
        <div className="space-y-4 pt-2 border-t border-white/10 text-xs">
          <div className="text-xs font-bold text-[#e0e8f0] uppercase tracking-wider">
            3 Cách chạy siêu đơn giản khi tải source về:
          </div>

          {/* Method 1 */}
          <div className="p-4 rounded-xl bg-[#0f1524] border border-[#7dd3fc]/20 space-y-1.5">
            <div className="font-bold text-[#7dd3fc] flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-[#0e4d6e] text-center leading-5 text-[11px] text-white">1</span>
              Cách dễ nhất: Click đúp vào file HTML (0 Cài Đặt)
            </div>
            <p className="text-[#a0b4c4] text-xs leading-relaxed">
              Trong VS Code, bạn chỉ cần mở file <code className="text-white bg-black/40 px-1 py-0.5 rounded font-mono">app.html</code>, nhấp chuột phải chọn <b>Open with Live Server</b> hoặc mở bằng Chrome/Edge. Giao diện chạy mượt mà ngay tức thì mà không cần bất kỳ lệnh hay package nào!
            </p>
          </div>

          {/* Method 2 */}
          <div className="p-4 rounded-xl bg-[#0f1524] border border-emerald-500/20 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-emerald-950 text-center leading-5 text-[11px] text-emerald-300">2</span>
              Chạy bằng Terminal Python có sẵn (0 pip install)
            </div>
            <p className="text-[#a0b4c4] text-xs">
              Mở Terminal trong VS Code và gõ lệnh:
            </p>
            <pre className="p-2.5 rounded-lg bg-black/60 text-emerald-300 font-mono text-xs select-all">python server.py</pre>
            <p className="text-[11px] text-[#a0b4c4]">
              File <code className="text-white font-mono">server.py</code> chỉ dùng thư viện tiêu chuẩn có sẵn trong Python 3 (không bao giờ thiếu package hay lỗi môi trường) và tự động mở trình duyệt lên cho bạn.
            </p>
          </div>

          {/* Method 3 */}
          <div className="p-4 rounded-xl bg-[#0f1524] border border-[#c8a0f0]/20 space-y-1.5">
            <div className="font-bold text-[#c8a0f0] flex items-center gap-2 text-sm">
              <span className="w-5 h-5 rounded-full bg-[#3d2060] text-center leading-5 text-[11px] text-[#e8d0ff]">3</span>
              Chạy bản React Vite (Nếu dùng Node.js)
            </div>
            <pre className="p-2.5 rounded-lg bg-black/60 text-[#c8eaff] font-mono text-xs select-all">npm install
npm run dev</pre>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/10 flex items-center justify-between">
          <div className="text-[11px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Đã tích hợp đầy đủ 5 vai trò: Login, Sinh viên, Giảng viên, Cố vấn, Quản trị
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
};

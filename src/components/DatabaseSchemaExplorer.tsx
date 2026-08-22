import React, { useEffect, useState } from 'react';
import { Check, Copy, Database, Download, Layers, Table } from 'lucide-react';
import { apiClient } from '../lib/api';

export const DatabaseSchemaExplorer: React.FC = () => {
  const [dialect, setDialect] = useState<'mysql' | 'postgresql' | 'sqlite'>('mysql');
  const [ddl, setDdl] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const fetchSchema = async () => {
      setLoading(true);
      const res = await apiClient.getSchema(dialect);
      setLoading(false);
      if (res.success && res.ddl) {
        setDdl(res.ddl);
      }
    };
    fetchSchema();
  }, [dialect]);

  const handleCopy = () => {
    navigator.clipboard.writeText(ddl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([ddl], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `secure_barangay_schema_${dialect}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overview & ER Relationship Cards */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Normalized Relational SQL Schema</h2>
              <p className="text-xs text-slate-600 font-medium">3NF Normalized Relational Architecture with B-Tree Indexes and Foreign Key Constraints</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .SQL</span>
            </button>
          </div>
        </div>

        {/* Entity Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Users Table */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Table className="w-4 h-4 text-blue-600" />
              <span>1. users</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Authentication, BCrypt credentials, and RBAC roles.</p>
            <ul className="space-y-1 font-mono text-[10px] text-slate-700 font-medium">
              <li className="text-amber-800 font-bold">• id (PK, UUID)</li>
              <li>• username (UNIQUE)</li>
              <li>• password_hash (BCrypt)</li>
              <li>• role (ENUM)</li>
              <li>• email (UNIQUE)</li>
            </ul>
          </div>

          {/* Resident Profiles */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Table className="w-4 h-4 text-emerald-600" />
              <span>2. resident_profiles</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Verified identity, PhilSys ID, residency years, & civil status.</p>
            <ul className="space-y-1 font-mono text-[10px] text-slate-700 font-medium">
              <li className="text-amber-800 font-bold">• id (PK)</li>
              <li className="text-blue-700 font-semibold">• user_id (FK -&gt; users)</li>
              <li>• first_name, last_name</li>
              <li>• id_type, id_number</li>
              <li>• purok_zone, street</li>
            </ul>
          </div>

          {/* Document Requests */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Table className="w-4 h-4 text-indigo-600" />
              <span>3. document_requests</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Pipeline states, crypto HMAC seals, and QR payload.</p>
            <ul className="space-y-1 font-mono text-[10px] text-slate-700 font-medium">
              <li className="text-amber-800 font-bold">• id (PK)</li>
              <li>• reference_number (UNIQUE)</li>
              <li className="text-blue-700 font-semibold">• resident_id (FK)</li>
              <li>• status (ENUM)</li>
              <li className="text-emerald-800 font-bold">• crypto_hash (SHA256)</li>
            </ul>
          </div>

          {/* Audit Logs */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <Table className="w-4 h-4 text-purple-600" />
              <span>4. audit_logs</span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium">Immutable hash-chained ledger for non-repudiation.</p>
            <ul className="space-y-1 font-mono text-[10px] text-slate-700 font-medium">
              <li className="text-amber-800 font-bold">• id (PK)</li>
              <li>• timestamp, user_id</li>
              <li>• action_type, severity</li>
              <li className="text-purple-700 font-semibold">• previous_hash (SHA256)</li>
              <li className="text-purple-900 font-bold">• current_hash (SHA256)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* SQL DDL Code Viewer */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2 text-slate-800 font-mono font-bold">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>schema_ddl.sql</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-600 font-medium">Dialect:</span>
            <select
              value={dialect}
              onChange={(e: any) => setDialect(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 font-bold text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="mysql">MySQL 8.0 / MariaDB</option>
              <option value="postgresql">PostgreSQL 15+</option>
              <option value="sqlite">SQLite 3</option>
            </select>
          </div>
        </div>

        <pre className="p-6 text-[11px] font-mono bg-slate-900 text-emerald-400 overflow-x-auto max-h-[480px] leading-relaxed select-all">
          {loading ? 'Loading SQL schema...' : ddl}
        </pre>
      </div>
    </div>
  );
};

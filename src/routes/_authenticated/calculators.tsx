import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Calculator, Percent, TrendingUp, Landmark } from "lucide-react";

export const Route = createFileRoute("/_authenticated/calculators")({
  head: () => ({ meta: [{ title: "Calculators — Proforma Hub" }, { name: "description", content: "Financial and web calculator suite." }] }),
  component: CalculatorsPage,
});

function CalculatorsPage() {
  return (
    <div className="p-6 md:p-10">
      <header className="mb-8">
        <h1 className="text-3xl font-black tracking-tight">Calculator suite</h1>
        <p className="text-sm text-muted-foreground">Financial and web utilities — everything you need in one place.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CardShell title="ROI calculator" icon={<TrendingUp className="h-4 w-4" />}><ROI /></CardShell>
        <CardShell title="Loan payment" icon={<Landmark className="h-4 w-4" />}><Loan /></CardShell>
        <CardShell title="Percentage" icon={<Percent className="h-4 w-4" />}><Percentage /></CardShell>
        <CardShell title="VAT / Tax" icon={<Calculator className="h-4 w-4" />}><VAT /></CardShell>
      </div>
    </div>
  );
}

function CardShell({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="glass p-6">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold"><span className="text-[color:var(--neon-blue)]">{icon}</span>{title}</h2>
      {children}
    </div>
  );
}

const fld = "w-full rounded-lg border border-input bg-surface px-3 py-2 text-sm outline-none focus:border-[color:var(--neon-blue)] focus:shadow-[var(--glow-blue)]";
const lbl = "block text-xs font-medium text-muted-foreground mb-1";
const res = "mt-4 rounded-lg border border-[color:var(--neon-green)]/30 bg-[color:var(--neon-green)]/5 p-3 text-sm";

function ROI() {
  const [inv, setInv] = useState(1000);
  const [ret, setRet] = useState(1500);
  const profit = ret - inv;
  const roi = inv > 0 ? (profit / inv) * 100 : 0;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Investment ($)</label><input type="number" value={inv} onChange={(e) => setInv(+e.target.value)} className={fld} /></div>
        <div><label className={lbl}>Return ($)</label><input type="number" value={ret} onChange={(e) => setRet(+e.target.value)} className={fld} /></div>
      </div>
      <div className={res}>
        <div className="flex justify-between"><span>Profit</span><b>${profit.toFixed(2)}</b></div>
        <div className="mt-1 flex justify-between"><span>ROI</span><b className="text-[color:var(--neon-green)]">{roi.toFixed(2)}%</b></div>
      </div>
    </div>
  );
}

function Loan() {
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(6);
  const [years, setYears] = useState(3);
  const monthlyRate = rate / 100 / 12;
  const n = years * 12;
  const payment = monthlyRate === 0 ? amount / n : (amount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -n));
  const total = payment * n;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div><label className={lbl}>Amount ($)</label><input type="number" value={amount} onChange={(e) => setAmount(+e.target.value)} className={fld} /></div>
        <div><label className={lbl}>APR (%)</label><input type="number" step="0.1" value={rate} onChange={(e) => setRate(+e.target.value)} className={fld} /></div>
        <div><label className={lbl}>Years</label><input type="number" value={years} onChange={(e) => setYears(+e.target.value)} className={fld} /></div>
      </div>
      <div className={res}>
        <div className="flex justify-between"><span>Monthly</span><b>${payment.toFixed(2)}</b></div>
        <div className="mt-1 flex justify-between"><span>Total paid</span><b>${total.toFixed(2)}</b></div>
        <div className="mt-1 flex justify-between"><span>Total interest</span><b>${(total - amount).toFixed(2)}</b></div>
      </div>
    </div>
  );
}

function Percentage() {
  const [x, setX] = useState(25);
  const [y, setY] = useState(200);
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Percent</label><input type="number" value={x} onChange={(e) => setX(+e.target.value)} className={fld} /></div>
        <div><label className={lbl}>Of value</label><input type="number" value={y} onChange={(e) => setY(+e.target.value)} className={fld} /></div>
      </div>
      <div className={res}>
        <div className="flex justify-between"><span>{x}% of {y}</span><b>{((x / 100) * y).toFixed(2)}</b></div>
        <div className="mt-1 flex justify-between"><span>{x} is what % of {y}</span><b>{y ? ((x / y) * 100).toFixed(2) : 0}%</b></div>
      </div>
    </div>
  );
}

function VAT() {
  const [net, setNet] = useState(100);
  const [vat, setVat] = useState(15);
  const tax = (net * vat) / 100;
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><label className={lbl}>Net price ($)</label><input type="number" value={net} onChange={(e) => setNet(+e.target.value)} className={fld} /></div>
        <div><label className={lbl}>VAT (%)</label><input type="number" step="0.1" value={vat} onChange={(e) => setVat(+e.target.value)} className={fld} /></div>
      </div>
      <div className={res}>
        <div className="flex justify-between"><span>Tax</span><b>${tax.toFixed(2)}</b></div>
        <div className="mt-1 flex justify-between"><span>Gross</span><b className="text-[color:var(--neon-green)]">${(net + tax).toFixed(2)}</b></div>
      </div>
    </div>
  );
}

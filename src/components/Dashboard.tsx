import { useState } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { Employee, SeedType } from '../types'

export function Dashboard() {
  const open = useAppStore((s) => s.dashboardOpen)
  const tab = useAppStore((s) => s.dashboardTab)
  const setTab = useAppStore((s) => s.setDashboardTab)
  const setOpen = useAppStore((s) => s.setDashboardOpen)

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
    >
      <div className="bg-panel border border-border w-[90vw] max-w-[700px] max-h-[85vh] flex flex-col relative">
        {/* Header */}
        <div className="flex items-center border-b border-border px-5 py-3">
          <h2 className="font-mono text-sm text-olive-lit tracking-[2px] flex-1">DASHBOARD</h2>
          <button
            onClick={() => setOpen(false)}
            className="bg-transparent border-none text-muted text-xl cursor-pointer hover:text-red transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border">
          {([
            ['params', 'Paramètres'],
            ['personnel', 'Personnel'],
            ['cultures', 'Cultures'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex-1 py-2.5 text-xs font-semibold uppercase tracking-[1px] border-b-2 transition-all cursor-pointer bg-transparent border-x-0 border-t-0
                ${tab === key
                  ? 'border-olive-lit text-olive-lit'
                  : 'border-transparent text-muted hover:text-text'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {tab === 'params' && <ParamsTab />}
          {tab === 'personnel' && <PersonnelTab />}
          {tab === 'cultures' && <CulturesTab />}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
//  PARAMÈTRES
// ═══════════════════════════════════════

function ParamsTab() {
  const store = useAppStore()

  return (
    <div className="space-y-5">
      <div>
        <label className="block font-mono text-[10px] text-olive-lit tracking-[2px] mb-2 uppercase">Méthode de génération</label>
        <select
          value={store.generationMethod}
          onChange={(e) => store.setGenerationMethod(e.target.value as any)}
          className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit"
        >
          <option value="grid">Grille régulière</option>
          <option value="zigzag">Zigzag (W)</option>
          <option value="random">Aléatoire stratifié</option>
        </select>
      </div>

      <div>
        <label className="block font-mono text-[10px] text-olive-lit tracking-[2px] mb-2 uppercase">Densité (pts/ha)</label>
        <input
          type="number"
          value={store.density}
          min={0.5}
          max={20}
          step={0.5}
          onChange={(e) => store.setDensity(parseFloat(e.target.value) || 1)}
          className="w-full font-mono text-xs bg-bg border border-border text-text py-2 px-3 outline-none focus:border-olive-lit"
        />
      </div>

      <div className="border-t border-border pt-4">
        <label className="block font-mono text-[10px] text-olive-lit tracking-[2px] mb-2 uppercase">Résumé exploitation</label>
        <div className="font-mono text-xs text-muted space-y-1">
          <div>Surface exploitation : <span className="text-cyan">{store.exploitArea > 0 ? store.exploitArea.toFixed(2) + ' ha' : '—'}</span></div>
          <div>Nombre de champs : <span className="text-text">{store.fields.length}</span></div>
          <div>Total points : <span className="text-amber">{store.fields.reduce((s, f) => s + f.points.length, 0)}</span></div>
          <div>Employés enregistrés : <span className="text-text">{store.employees.length}</span></div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════
//  PERSONNEL
// ═══════════════════════════════════════

function PersonnelTab() {
  const employees = useAppStore((s) => s.employees)
  const addEmployee = useAppStore((s) => s.addEmployee)
  const updateEmployee = useAppStore((s) => s.updateEmployee)
  const removeEmployee = useAppStore((s) => s.removeEmployee)
  const toast = useAppStore((s) => s.toast)

  const [name, setName] = useState('')
  const [role, setRole] = useState<Employee['role']>('employe')
  const [phone, setPhone] = useState('')
  const [editId, setEditId] = useState<number | null>(null)

  const handleAdd = () => {
    if (!name.trim()) return
    if (editId !== null) {
      updateEmployee(editId, { name: name.trim(), role, phone: phone.trim() || undefined })
      toast(`✓ ${name.trim()} mis à jour`)
      setEditId(null)
    } else {
      addEmployee({ name: name.trim(), role, phone: phone.trim() || undefined })
      toast(`✓ ${name.trim()} ajouté`)
    }
    setName('')
    setPhone('')
    setRole('employe')
  }

  const startEdit = (emp: Employee) => {
    setEditId(emp.id)
    setName(emp.name)
    setRole(emp.role)
    setPhone(emp.phone || '')
  }

  const managers = employees.filter((e) => e.role === 'responsable')
  const workers = employees.filter((e) => e.role === 'employe')

  return (
    <div className="space-y-4">
      {/* Add form */}
      <div className="bg-bg border border-border p-3 space-y-2">
        <div className="font-mono text-[10px] text-olive-lit tracking-[2px] uppercase mb-1">
          {editId ? 'Modifier' : 'Ajouter'}
        </div>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom complet"
          className="w-full font-mono text-xs bg-panel border border-border text-text py-1.5 px-2.5 outline-none focus:border-olive-lit placeholder:text-muted"
        />
        <div className="flex gap-2">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Téléphone (optionnel)"
            className="flex-1 font-mono text-xs bg-panel border border-border text-text py-1.5 px-2.5 outline-none focus:border-olive-lit placeholder:text-muted"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Employee['role'])}
            className="font-mono text-xs bg-panel border border-border text-text py-1.5 px-2.5 outline-none focus:border-olive-lit"
          >
            <option value="employe">Employé</option>
            <option value="responsable">Responsable</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button className="btn-active flex-1" onClick={handleAdd}>
            {editId ? '✓ Mettre à jour' : '+ Ajouter'}
          </button>
          {editId && (
            <button className="btn-danger" onClick={() => { setEditId(null); setName(''); setPhone(''); setRole('employe') }}>
              Annuler
            </button>
          )}
        </div>
      </div>

      {/* Responsables */}
      {managers.length > 0 && (
        <div>
          <div className="font-mono text-[10px] text-amber tracking-[2px] uppercase mb-2">Responsables ({managers.length})</div>
          {managers.map((emp) => (
            <EmployeeRow key={emp.id} emp={emp} onEdit={startEdit} onDelete={removeEmployee} />
          ))}
        </div>
      )}

      {/* Employés */}
      {workers.length > 0 && (
        <div>
          <div className="font-mono text-[10px] text-olive-lit tracking-[2px] uppercase mb-2">Employés ({workers.length})</div>
          {workers.map((emp) => (
            <EmployeeRow key={emp.id} emp={emp} onEdit={startEdit} onDelete={removeEmployee} />
          ))}
        </div>
      )}

      {employees.length === 0 && (
        <div className="text-center text-muted text-xs py-6">
          Aucun personnel enregistré.<br />Ajoutez des employés et responsables.
        </div>
      )}
    </div>
  )
}

function EmployeeRow({ emp, onEdit, onDelete }: {
  emp: Employee
  onEdit: (emp: Employee) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className="flex items-center gap-2 py-1.5 px-2 border-b border-border/50 hover:bg-olive/5 transition-colors">
      <div className={`w-2 h-2 rounded-full shrink-0 ${emp.role === 'responsable' ? 'bg-amber' : 'bg-olive-lit'}`} />
      <span className="font-mono text-xs text-text flex-1">{emp.name}</span>
      {emp.phone && <span className="font-mono text-[10px] text-muted">{emp.phone}</span>}
      <button
        onClick={() => onEdit(emp)}
        className="text-muted text-[10px] bg-transparent border-none cursor-pointer hover:text-olive-lit transition-colors"
      >
        ✎
      </button>
      <button
        onClick={() => onDelete(emp.id)}
        className="text-muted text-xs bg-transparent border-none cursor-pointer hover:text-red transition-colors"
      >
        ✕
      </button>
    </div>
  )
}

// ═══════════════════════════════════════
//  CULTURES
// ═══════════════════════════════════════

function CulturesTab() {
  const store = useAppStore()
  const [newStrain, setNewStrain] = useState('')

  const handleAddStrain = () => {
    if (!newStrain.trim()) return
    store.addStrain(newStrain.trim())
    store.toast(`✓ Strain "${newStrain.trim()}" ajoutée`)
    setNewStrain('')
  }

  return (
    <div className="space-y-5">
      {/* Strain catalog */}
      <div>
        <div className="font-mono text-[10px] text-olive-lit tracking-[2px] uppercase mb-2">Catalogue strains Cali</div>
        <p className="text-[11px] text-muted mb-3 leading-relaxed">
          Gérez ici la liste des strains disponibles pour les champs de type Cali.
        </p>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newStrain}
            onChange={(e) => setNewStrain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddStrain()}
            placeholder="Nom de la strain (ex: OG Kush)"
            className="flex-1 font-mono text-xs bg-bg border border-border text-text py-1.5 px-2.5 outline-none focus:border-olive-lit placeholder:text-muted"
          />
          <button className="btn-active" onClick={handleAddStrain}>+</button>
        </div>
        {store.strains.length > 0 ? (
          <div className="space-y-0">
            {store.strains.map((strain) => (
              <div key={strain} className="flex items-center gap-2 py-1.5 px-2 border-b border-border/50">
                <span className="font-mono text-xs text-text flex-1">{strain}</span>
                <button
                  onClick={() => store.removeStrain(strain)}
                  className="text-muted text-xs bg-transparent border-none cursor-pointer hover:text-red transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted text-xs py-4">
            Aucune strain enregistrée.
          </div>
        )}
      </div>

      {/* Field culture + personnel assignments */}
      <div className="border-t border-border pt-4">
        <div className="font-mono text-[10px] text-olive-lit tracking-[2px] uppercase mb-2">Configuration par champ</div>
        {store.fields.length > 0 ? (
          <div className="space-y-3">
            {store.fields.map((f) => (
              <FieldConfigRow key={f.id} field={f} strains={store.strains} employees={store.employees} />
            ))}
          </div>
        ) : (
          <div className="text-center text-muted text-xs py-4">
            Aucun champ défini.
          </div>
        )}
      </div>
    </div>
  )
}

function FieldConfigRow({ field, strains, employees }: {
  field: { id: number; name: string; color: string; area: number; culture?: { seedType: SeedType; strain: string }; assignedManager: number | null; assignedEmployees: number[] }
  strains: string[]
  employees: Employee[]
}) {
  const updateField = useAppStore((s) => s.updateField)
  const seedType = field.culture?.seedType || 'beldia'
  const strain = field.culture?.strain || ''
  const managers = employees.filter((e) => e.role === 'responsable')
  const workers = employees.filter((e) => e.role === 'employe')

  const toggleEmployee = (empId: number) => {
    const current = field.assignedEmployees
    const updated = current.includes(empId)
      ? current.filter((id) => id !== empId)
      : [...current, empId]
    updateField(field.id, { assignedEmployees: updated })
  }

  return (
    <div className="bg-bg border border-border p-3">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: field.color }} />
        <span className="font-mono text-xs text-text font-bold flex-1">{field.name}</span>
        <span className="font-mono text-[9px] text-muted">{field.area.toFixed(2)} ha</span>
      </div>

      {/* Culture */}
      <div className="mb-2">
        <div className="font-mono text-[9px] text-muted tracking-[1px] uppercase mb-1">Culture</div>
        <div className="flex gap-2">
          <select
            value={seedType}
            onChange={(e) => {
              const newType = e.target.value as SeedType
              updateField(field.id, {
                culture: { seedType: newType, strain: newType === 'beldia' ? '' : strain },
              })
            }}
            className="font-mono text-xs bg-panel border border-border text-text py-1 px-2 outline-none focus:border-olive-lit"
          >
            <option value="beldia">Beldia</option>
            <option value="cali">Cali</option>
          </select>
          {seedType === 'cali' && (
            <select
              value={strain}
              onChange={(e) => {
                updateField(field.id, { culture: { seedType: 'cali', strain: e.target.value } })
              }}
              className="flex-1 font-mono text-xs bg-panel border border-border text-text py-1 px-2 outline-none focus:border-olive-lit"
            >
              <option value="">— Choisir strain —</option>
              {strains.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Responsable */}
      <div className="mb-2">
        <div className="font-mono text-[9px] text-muted tracking-[1px] uppercase mb-1">Responsable</div>
        <select
          value={field.assignedManager || ''}
          onChange={(e) => updateField(field.id, { assignedManager: e.target.value ? parseInt(e.target.value) : null })}
          className="w-full font-mono text-xs bg-panel border border-border text-text py-1 px-2 outline-none focus:border-olive-lit"
        >
          <option value="">— Aucun —</option>
          {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Employés */}
      {workers.length > 0 && (
        <div>
          <div className="font-mono text-[9px] text-muted tracking-[1px] uppercase mb-1">Employés assignés</div>
          <div className="flex flex-wrap gap-1">
            {workers.map((w) => {
              const isAssigned = field.assignedEmployees.includes(w.id)
              return (
                <button
                  key={w.id}
                  onClick={() => toggleEmployee(w.id)}
                  className={`font-mono text-[10px] px-2 py-0.5 border cursor-pointer transition-all
                    ${isAssigned
                      ? 'bg-olive border-olive-lit text-white'
                      : 'bg-transparent border-border text-muted hover:border-olive hover:text-olive-lit'}`}
                >
                  {w.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

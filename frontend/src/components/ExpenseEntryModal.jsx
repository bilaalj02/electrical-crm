import { useState, useEffect } from 'react';
import { FiX, FiDollarSign, FiPlus, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

function ExpenseEntryModal({ isOpen, onClose, job, onSave }) {
  const { user } = useAuth();
  const [actualExpenses, setActualExpenses] = useState({
    laborHours: 0,
    laborRate: 85,
    materials: [],
    equipment: [],
    permitsCost: 0,
    subcontractorsCost: 0,
    otherCosts: 0,
    taxRate: 0.0825,
    discount: 0
  });

  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize with job's quoted costs if available
  useEffect(() => {
    if (job?.costs) {
      setActualExpenses({
        laborHours: job.costs.laborHours || 0,
        laborRate: job.costs.laborRate || 85,
        materials: job.costs.materials?.map(m => ({ ...m })) || [],
        equipment: job.costs.equipment?.map(e => ({ ...e })) || [],
        permitsCost: job.costs.permitsCost || 0,
        subcontractorsCost: job.costs.subcontractorsCost || 0,
        otherCosts: job.costs.otherCosts || 0,
        taxRate: job.costs.taxRate || 0.0825,
        discount: job.costs.discount || 0
      });
    }
  }, [job]);

  // Calculate totals
  const calculateTotals = () => {
    const laborTotal = actualExpenses.laborHours * actualExpenses.laborRate;
    const materialsTotal = actualExpenses.materials.reduce((sum, m) => sum + (m.totalPrice || 0), 0);
    const equipmentTotal = actualExpenses.equipment.reduce((sum, e) => sum + (e.cost || 0), 0);

    const subtotal = laborTotal + materialsTotal + equipmentTotal +
      actualExpenses.permitsCost + actualExpenses.subcontractorsCost + actualExpenses.otherCosts;

    const tax = subtotal * actualExpenses.taxRate;
    const total = subtotal + tax;
    const finalTotal = total - actualExpenses.discount;

    return { laborTotal, materialsTotal, equipmentTotal, subtotal, tax, total, finalTotal };
  };

  const handleSave = async () => {
    setLoading(true);
    const totals = calculateTotals();

    const expenseData = {
      ...actualExpenses,
      ...totals,
      enteredAt: new Date(),
      enteredBy: user?.name || 'Unknown User'
    };

    try {
      await axios.patch(`${API_URL}/jobs/${job._id}`, {
        actualExpenses: expenseData,
        status: 'completed'
      });

      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving actual expenses:', error);
      alert('Failed to save actual expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setShowSkipWarning(true);
  };

  const confirmSkip = async () => {
    setLoading(true);
    try {
      await axios.patch(`${API_URL}/jobs/${job._id}/status`, {
        status: 'completed'
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update job status');
    } finally {
      setLoading(false);
    }
  };

  // Material management
  const addMaterial = () => {
    setActualExpenses(prev => ({
      ...prev,
      materials: [...prev.materials, { name: '', description: '', quantity: 0, unitPrice: 0, totalPrice: 0 }]
    }));
  };

  const updateMaterial = (index, field, value) => {
    setActualExpenses(prev => {
      const materials = [...prev.materials];
      materials[index] = { ...materials[index], [field]: value };

      // Auto-calculate totalPrice
      if (field === 'quantity' || field === 'unitPrice') {
        materials[index].totalPrice = materials[index].quantity * materials[index].unitPrice;
      }

      return { ...prev, materials };
    });
  };

  const removeMaterial = (index) => {
    setActualExpenses(prev => ({
      ...prev,
      materials: prev.materials.filter((_, i) => i !== index)
    }));
  };

  // Equipment management
  const addEquipment = () => {
    setActualExpenses(prev => ({
      ...prev,
      equipment: [...prev.equipment, { name: '', cost: 0 }]
    }));
  };

  const updateEquipment = (index, field, value) => {
    setActualExpenses(prev => {
      const equipment = [...prev.equipment];
      equipment[index] = { ...equipment[index], [field]: value };
      return { ...prev, equipment };
    });
  };

  const removeEquipment = (index) => {
    setActualExpenses(prev => ({
      ...prev,
      equipment: prev.equipment.filter((_, i) => i !== index)
    }));
  };

  if (!isOpen || !job) return null;

  const totals = calculateTotals();
  const quotedTotal = job.costs?.finalTotal || 0;
  const profit = quotedTotal - totals.finalTotal;

  return (
    <div className="modal-overlay">
      <div className="modal-content large">
        <div className="modal-header">
          <h2><FiDollarSign /> Enter Actual Job Expenses</h2>
          <button className="btn-close" onClick={onClose}><FiX /></button>
        </div>

        <div className="modal-body">
          {/* Comparison Cards */}
          <div className="expense-comparison">
            <div className="comparison-card quoted">
              <span className="label">Quoted Total:</span>
              <span className="amount">${quotedTotal.toFixed(2)}</span>
            </div>
            <div className="comparison-card actual">
              <span className="label">Actual Total:</span>
              <span className="amount">${totals.finalTotal.toFixed(2)}</span>
            </div>
            <div className={`comparison-card ${profit >= 0 ? 'profit' : 'loss'}`}>
              <span className="label">Profit/Loss:</span>
              <span className="amount">${profit.toFixed(2)}</span>
            </div>
          </div>

          {/* Labor Section */}
          <div className="form-section">
            <h3>Labor</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Labor Hours</label>
                <input
                  type="number"
                  step="0.5"
                  value={actualExpenses.laborHours}
                  onChange={(e) => setActualExpenses(prev => ({ ...prev, laborHours: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={actualExpenses.laborRate}
                  onChange={(e) => setActualExpenses(prev => ({ ...prev, laborRate: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Labor Total</label>
                <input
                  type="text"
                  value={`$${totals.laborTotal.toFixed(2)}`}
                  readOnly
                  className="read-only"
                />
              </div>
            </div>
          </div>

          {/* Materials Section */}
          <div className="form-section">
            <h3>Materials</h3>
            {actualExpenses.materials.map((material, index) => (
              <div key={index} className="material-row">
                <input
                  type="text"
                  placeholder="Material name"
                  value={material.name}
                  onChange={(e) => updateMaterial(index, 'name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={material.quantity}
                  onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                  style={{ width: '80px' }}
                />
                <input
                  type="number"
                  placeholder="Unit Price"
                  step="0.01"
                  value={material.unitPrice}
                  onChange={(e) => updateMaterial(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                  style={{ width: '120px' }}
                />
                <input
                  type="text"
                  value={`$${(material.totalPrice || 0).toFixed(2)}`}
                  readOnly
                  className="read-only"
                  style={{ width: '120px' }}
                />
                <button onClick={() => removeMaterial(index)} className="btn-icon-danger">
                  <FiTrash2 />
                </button>
              </div>
            ))}
            <button onClick={addMaterial} className="btn-secondary">
              <FiPlus /> Add Material
            </button>
          </div>

          {/* Equipment Section */}
          <div className="form-section">
            <h3>Equipment/Tools</h3>
            {actualExpenses.equipment.map((item, index) => (
              <div key={index} className="equipment-row">
                <input
                  type="text"
                  placeholder="Equipment name"
                  value={item.name}
                  onChange={(e) => updateEquipment(index, 'name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Cost"
                  step="0.01"
                  value={item.cost}
                  onChange={(e) => updateEquipment(index, 'cost', parseFloat(e.target.value) || 0)}
                  style={{ width: '150px' }}
                />
                <button onClick={() => removeEquipment(index)} className="btn-icon-danger">
                  <FiTrash2 />
                </button>
              </div>
            ))}
            <button onClick={addEquipment} className="btn-secondary">
              <FiPlus /> Add Equipment
            </button>
          </div>

          {/* Other Costs Section */}
          <div className="form-section">
            <h3>Other Costs</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Permits ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={actualExpenses.permitsCost}
                  onChange={(e) => setActualExpenses(prev => ({ ...prev, permitsCost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Subcontractors ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={actualExpenses.subcontractorsCost}
                  onChange={(e) => setActualExpenses(prev => ({ ...prev, subcontractorsCost: parseFloat(e.target.value) || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Other ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={actualExpenses.otherCosts}
                  onChange={(e) => setActualExpenses(prev => ({ ...prev, otherCosts: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Tax Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  value={(actualExpenses.taxRate * 100).toFixed(2)}
                  onChange={(e) => setActualExpenses(prev => ({ ...prev, taxRate: parseFloat(e.target.value) / 100 || 0 }))}
                />
              </div>
              <div className="form-group">
                <label>Discount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={actualExpenses.discount}
                  onChange={(e) => setActualExpenses(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
          </div>

          {/* Skip Warning Overlay */}
          {showSkipWarning && (
            <div className="warning-overlay">
              <div className="warning-box">
                <FiAlertCircle size={48} color="#f59e0b" />
                <h3>Skip Expense Entry?</h3>
                <p>You can still enter actual expenses later by editing the job.</p>
                <div className="warning-actions">
                  <button onClick={() => setShowSkipWarning(false)} className="btn-secondary">
                    Go Back
                  </button>
                  <button onClick={confirmSkip} className="btn-warning" disabled={loading}>
                    {loading ? 'Processing...' : 'Skip Anyway'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={handleSkip} className="btn-secondary" disabled={loading}>
            Skip for Now
          </button>
          <button onClick={handleSave} className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save & Mark Completed'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExpenseEntryModal;

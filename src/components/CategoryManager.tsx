import { useState } from 'react';
import { SYSTEM_CATEGORIES } from '../types';
import { loadCategoryMap, saveCategoryMap } from '../storage';
import baselineMappings from '../categoryMap.json';

interface Props {
  categories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategoryManager({ categories, onCategoriesChange }: Props) {
  const [newCategory, setNewCategory] = useState('');
  const userCategories = categories.filter(
    c => !(SYSTEM_CATEGORIES as readonly string[]).includes(c)
  );

  function addCategory() {
    const name = newCategory.trim();
    if (!name || categories.includes(name)) return;
    onCategoriesChange([...categories, name]);
    setNewCategory('');
  }

  function removeCategory(cat: string) {
    if ((SYSTEM_CATEGORIES as readonly string[]).includes(cat)) return;
    onCategoriesChange(categories.filter(c => c !== cat));
  }

  function clearLearnedMappings() {
    if (confirm('Clear all learned category mappings? New imports will start with no auto-categorization.')) {
      saveCategoryMap({});
    }
  }

  function exportMappings() {
    const map = loadCategoryMap();
    const count = Object.keys(map).length;
    const blob = new Blob([JSON.stringify(map, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'category-mappings.json';
    a.click();
    URL.revokeObjectURL(url);
    alert(`Exported ${count} mappings.`);
  }

  function importMappings(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (typeof data === 'object' && data !== null) {
          const existing = loadCategoryMap();
          const merged = { ...existing, ...data };
          saveCategoryMap(merged);
          alert(`Imported ${Object.keys(data).length} mappings (${Object.keys(merged).length} total).`);
        }
      } catch {
        alert('Invalid JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  return (
    <div className="category-manager">
      <h2>Settings</h2>

      <div className="settings-section">
        <h3>Categories</h3>
        <p className="settings-description">Add or remove spending categories. System categories (Income, Other, Ignore) cannot be removed.</p>

        <div className="add-budget-form" style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="New category name"
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCategory()}
          />
          <button onClick={addCategory}>Add</button>
        </div>

        <div className="category-list">
          {userCategories.map(cat => (
            <div key={cat} className="category-item">
              <span>{cat}</span>
              <button className="remove-btn" onClick={() => removeCategory(cat)}>×</button>
            </div>
          ))}
          {(SYSTEM_CATEGORIES as readonly string[]).map(cat => (
            <div key={cat} className="category-item system">
              <span>{cat}</span>
              <span className="system-label">system</span>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <h3>Auto-Categorization</h3>
        <p className="settings-description">
          The app learns from your categorization choices. When you import or edit transactions,
          those description-to-category mappings are saved so future imports are automatically categorized.
        </p>
        <p className="settings-description">
          <strong>{Object.keys(loadCategoryMap()).length}</strong> mappings learned so far.
        </p>
        <div className="settings-actions">
          <button onClick={exportMappings}>Export Mappings</button>
          <label className="file-btn">
            Import Mappings
            <input type="file" accept=".json" onChange={importMappings} hidden />
          </label>
          <button onClick={() => {
            const existing = loadCategoryMap();
            const merged = { ...baselineMappings, ...existing };
            saveCategoryMap(merged);
            alert(`Loaded ${Object.keys(baselineMappings).length} baseline mappings from 2025 data (${Object.keys(merged).length} total).`);
          }}>Load 2025 Baseline</button>
          <button className="clear-btn" onClick={clearLearnedMappings}>Clear Mappings</button>
        </div>
      </div>
    </div>
  );
}

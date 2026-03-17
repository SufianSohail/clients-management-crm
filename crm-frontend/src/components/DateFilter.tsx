import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export type DateFilterType = 'contractStartDate' | 'updatedDate' | 'createdDate' | null;
export type DateFilterMode = 'range' | 'month' | 'year';

export interface DateFilterState {
    type: DateFilterType;
    mode: DateFilterMode;
    startDate?: string;
    endDate?: string;
    month?: string; // Format: YYYY-MM
    year?: string;  // Format: YYYY
}

interface DateFilterProps {
    filterState: DateFilterState;
    onChange: (state: DateFilterState) => void;
}

export function DateFilter({ filterState, onChange }: DateFilterProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const type = e.target.value as DateFilterType | '';
        onChange({ ...filterState, type: type === '' ? null : type });
    };

    const handleModeChange = (mode: DateFilterMode) => {
        onChange({ ...filterState, mode, startDate: '', endDate: '', month: '', year: '' });
    };

    const handleClear = () => {
        onChange({ type: null, mode: 'range' });
        setIsOpen(false);
    };

    const isActive = filterState.type !== null && (
        (filterState.mode === 'range' && filterState.startDate && filterState.endDate) ||
        (filterState.mode === 'month' && filterState.month) ||
        (filterState.mode === 'year' && filterState.year)
    );

    return (
        <div className="relative flex-shrink-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 h-10 border rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap shadow-sm ${isActive
                    ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
            >
                <Calendar className="w-4 h-4" />
                {isActive ? 'Date Filter Active' : 'Filter by Date'}
                <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-xl shadow-xl z-50 min-w-[320px] p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 block">Advanced Date Filter</h3>

                        <div className="space-y-4">
                            {/* Filter Target */}
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Filter Based On</label>
                                <select
                                    value={filterState.type || ''}
                                    onChange={handleTypeChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">None (Disabled)</option>
                                    <option value="contractStartDate">Contract Start Date</option>
                                    <option value="updatedDate">Client Updated Date (Upsell/Edit)</option>
                                    <option value="createdDate">Client Created Date</option>
                                </select>
                            </div>

                            {filterState.type && (
                                <>
                                    {/* Selection Mode */}
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        {(['month', 'year', 'range'] as const).map(mode => (
                                            <button
                                                key={mode}
                                                onClick={() => handleModeChange(mode)}
                                                className={`flex-1 text-xs py-1.5 font-medium rounded-md capitalize transition-colors ${filterState.mode === mode ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
                                                    }`}
                                            >
                                                {mode}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Inputs based on mode */}
                                    <div className="pt-2">
                                        {filterState.mode === 'month' && (
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Select Month</label>
                                                <input
                                                    type="month"
                                                    value={filterState.month || ''}
                                                    onChange={e => onChange({ ...filterState, month: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                        )}

                                        {filterState.mode === 'year' && (
                                            <div>
                                                <label className="block text-xs text-gray-600 mb-1">Select Year</label>
                                                <input
                                                    type="number"
                                                    placeholder="YYYY"
                                                    min="2000"
                                                    max="2100"
                                                    value={filterState.year || ''}
                                                    onChange={e => onChange({ ...filterState, year: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                />
                                            </div>
                                        )}

                                        {filterState.mode === 'range' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">Start Date</label>
                                                    <input
                                                        type="date"
                                                        value={filterState.startDate || ''}
                                                        onChange={e => onChange({ ...filterState, startDate: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs text-gray-600 mb-1">End Date</label>
                                                    <input
                                                        type="date"
                                                        value={filterState.endDate || ''}
                                                        onChange={e => onChange({ ...filterState, endDate: e.target.value })}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-100">
                                <button
                                    onClick={handleClear}
                                    className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-1 transition-colors"
                                >
                                    Clear Filter
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg transition-colors"
                                >
                                    Apply & Close
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

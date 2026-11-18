import React, { useState, useEffect, useMemo } from 'react';
import {
  CreditCard,
  Printer,
  Search,
  Filter,
  CheckSquare,
  Square,
  RotateCw,
  Layers,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  Users,
  Eye,
} from 'lucide-react';
import { StudentService } from '../../services/student.service';
import { ClassService } from '../../services/class.service';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { StudentIdCard, CardStudent, CardSchool } from '../../components/idcard/StudentIdCard';
import { StudentPhotoCaptureModal } from '../../components/idcard/StudentPhotoCaptureModal';
import { SchoolLogoUploadModal } from '../../components/idcard/SchoolLogoUploadModal';

export const StudentIdCardPage: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToast();
  const school = user?.school as CardSchool | undefined;

  // Filter & list state
  const [students, setStudents] = useState<CardStudent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyWithPhoto, setOnlyWithPhoto] = useState<boolean>(false);

  // Print Queue & Layout Settings
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [sideMode, setSideMode] = useState<'front' | 'back' | 'duplex'>('front');
  const [activeTab, setActiveTab] = useState<'selector' | 'preview'>('selector');

  // Photo Capture Modal
  const [photoModalStudent, setPhotoModalStudent] = useState<CardStudent | null>(null);
  // School Logo Upload Modal
  const [logoModalOpen, setLogoModalOpen] = useState<boolean>(false);
  const [activeSchoolLogo, setActiveSchoolLogo] = useState<string | null>(school?.logoUrl || null);

  useEffect(() => {
    if (school?.logoUrl) {
      setActiveSchoolLogo(school.logoUrl);
    }
  }, [school?.logoUrl]);

  // Load Classes
  useEffect(() => {
    ClassService.getClasses()
      .then((res: any) => {
        const clsList = Array.isArray(res) ? res : res?.classes || res?.data || [];
        setClasses(clsList);
      })
      .catch((err: any) => console.error('Failed to load classes:', err));
  }, []);

  // Fetch Students
  useEffect(() => {
    fetchStudents();
  }, [selectedClassId, selectedSectionId]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await StudentService.getStudents({
        pageSize: 100,
        classId: selectedClassId || undefined,
        sectionId: selectedSectionId || undefined,
        status: 'ACTIVE',
      });
      setStudents(res.students as unknown as CardStudent[]);
    } catch (err: any) {
      console.error('Error fetching students:', err);
      error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  // Filtered students
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      if (onlyWithPhoto && !st.photoUrl) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = `${st.firstName} ${st.lastName}`.toLowerCase().includes(q);
        const matchesAdm = st.admissionNumber?.toLowerCase().includes(q);
        const matchesClass = st.class?.name?.toLowerCase().includes(q);
        if (!matchesName && !matchesAdm && !matchesClass) return false;
      }
      return true;
    });
  }, [students, onlyWithPhoto, searchQuery]);

  // Selected student objects
  const selectedStudents = useMemo(() => {
    return students.filter((st) => selectedStudentIds.has(st.id));
  }, [students, selectedStudentIds]);

  // Capacity calculation per A4 sheet
  // Landscape: 8 per sheet (2 cols x 4 rows)
  // Portrait: 9 per sheet (3 cols x 3 rows)
  const slotsPerPage = orientation === 'landscape' ? 8 : 9;
  const totalSelected = selectedStudents.length;
  const sheetsNeeded = Math.ceil(totalSelected / slotsPerPage) || 1;
  const slotsOnLastSheet = totalSelected % slotsPerPage;
  const slotsRemaining = slotsOnLastSheet === 0 && totalSelected > 0 ? 0 : slotsPerPage - slotsOnLastSheet;

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedStudentIds(new Set());
    } else {
      setSelectedStudentIds(new Set(filteredStudents.map((s) => s.id)));
    }
  };

  const handleSelectOnlyWithPhoto = () => {
    const withPhotos = filteredStudents.filter((s) => !!s.photoUrl);
    setSelectedStudentIds(new Set(withPhotos.map((s) => s.id)));
    success(`Selected ${withPhotos.length} students with photos`);
  };

  const handlePrint = () => {
    if (selectedStudents.length === 0) {
      error('Please select at least one student to print ID cards.');
      return;
    }

    const originalTitle = document.title;
    document.title = `Student_ID_Cards_${selectedStudents.length}_Cards_${orientation.toUpperCase()}`;
    document.body.classList.add('printing-id-cards');

    const cleanup = () => {
      document.title = originalTitle;
      document.body.classList.remove('printing-id-cards');
      window.removeEventListener('afterprint', cleanup);
    };

    window.addEventListener('afterprint', cleanup);

    window.print();

    // Fallback cleanup
    setTimeout(cleanup, 2000);
  };

  // Memoized school object with dynamically updated logoUrl
  const effectiveSchool = useMemo(() => {
    return school ? { ...school, logoUrl: activeSchoolLogo } : null;
  }, [school, activeSchoolLogo]);
  const studentPages = useMemo(() => {
    const pages: CardStudent[][] = [];
    for (let i = 0; i < selectedStudents.length; i += slotsPerPage) {
      pages.push(selectedStudents.slice(i, i + slotsPerPage));
    }
    return pages;
  }, [selectedStudents, slotsPerPage]);

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-16">
      {/* Top Header & Breadcrumb (Screen only) */}
      <div className="no-print border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-800 px-6 py-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                Student ID Card Generator & Print Studio
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                  CR80 Standard
                </span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Generate ISO/IEC 7810 ID-1 standard laminated ID cards with zero paper waste A4 grid packing.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setLogoModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/60 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition flex items-center gap-1.5 shadow-xs"
              title="Upload or update institution crest/logo"
            >
              <ImageIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>{activeSchoolLogo ? 'Change School Logo' : 'Upload School Logo'}</span>
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'selector' ? 'preview' : 'selector')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition flex items-center gap-1.5 shadow-xs"
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              {activeTab === 'selector' ? 'Live A4 Print Preview' : 'Back to Selection'}
            </button>
            <button
              onClick={handlePrint}
              disabled={selectedStudents.length === 0}
              className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white shadow-sm transition flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print Selected ID Cards ({selectedStudents.length})
            </button>
          </div>
        </div>

        {/* Paper Waste & Efficiency Tracker Badge */}
        <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-indigo-50 via-purple-50 to-emerald-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-emerald-950/30 border border-indigo-100 dark:border-indigo-900/50 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">
              <strong>Print Queue:</strong> {totalSelected} card(s) selected • Fits on{' '}
              <strong className="text-indigo-600 dark:text-indigo-400">{sheetsNeeded} A4 Sheet(s)</strong>{' '}
              ({orientation === 'landscape' ? '8 cards/sheet: 2×4 grid' : '9 cards/sheet: 3×3 grid'})
            </span>
          </div>

          {totalSelected > 0 && slotsRemaining > 0 && (
            <span className="text-amber-700 dark:text-amber-400 font-medium bg-amber-100/70 dark:bg-amber-900/40 px-2.5 py-1 rounded-md text-[11px]">
              Tip: Add {slotsRemaining} more student(s) to completely fill the last A4 sheet!
            </span>
          )}
        </div>
      </div>

      {/* Screen Controls & Filters (no-print) */}
      <div className="no-print max-w-7xl mx-auto px-6 pt-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search student name or Adm No..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              />
            </div>

            {/* Class Filter */}
            <div>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedSectionId('');
                }}
                className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
              >
                <option value="">All Classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Orientation Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  orientation === 'landscape'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Landscape (2×4)
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  orientation === 'portrait'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Portrait (3×3)
              </button>
            </div>

            {/* Side Mode Switcher */}
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setSideMode('front')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  sideMode === 'front'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Front Only
              </button>
              <button
                type="button"
                onClick={() => setSideMode('back')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  sideMode === 'back'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Back Only
              </button>
              <button
                type="button"
                onClick={() => setSideMode('duplex')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition ${
                  sideMode === 'duplex'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                Duplex (F&B)
              </button>
            </div>
          </div>

          {/* Quick Selection Helpers */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-xs">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSelectAll}
                className="px-2.5 py-1 rounded bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium transition"
              >
                {selectedStudentIds.size === filteredStudents.length && filteredStudents.length > 0
                  ? 'Deselect All'
                  : 'Select All Filtered'}
              </button>
              <button
                type="button"
                onClick={handleSelectOnlyWithPhoto}
                className="px-2.5 py-1 rounded bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 font-medium transition"
              >
                Select Only With Photos
              </button>
              <label className="flex items-center gap-1.5 cursor-pointer ml-2 text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  checked={onlyWithPhoto}
                  onChange={(e) => setOnlyWithPhoto(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                Filter Only With Photos
              </label>
            </div>

            <div className="text-gray-500 dark:text-gray-400">
              Showing <strong>{filteredStudents.length}</strong> students • Selected{' '}
              <strong className="text-indigo-600 dark:text-indigo-400">{selectedStudentIds.size}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Main Studio View (Screen Selector vs Screen Preview) */}
      <div className="no-print max-w-7xl mx-auto px-6">
        {activeTab === 'selector' ? (
          /* Student Selector Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? (
              <div className="col-span-full py-16 text-center text-gray-400">
                <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading students directory...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="col-span-full py-16 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <Users className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold">No students found</p>
                <p className="text-xs text-gray-400 mt-1">Try resetting filters or searching another keyword.</p>
              </div>
            ) : (
              filteredStudents.map((st) => {
                const isSelected = selectedStudentIds.has(st.id);
                return (
                  <div
                    key={st.id}
                    className={`relative rounded-xl border p-4 transition cursor-pointer bg-white dark:bg-gray-800 ${
                      isSelected
                        ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md'
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    }`}
                    onClick={() => handleToggleSelect(st.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSelect(st.id);
                        }}
                        className="text-indigo-600 mt-0.5"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-indigo-600 text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-gray-300 dark:text-gray-600" />
                        )}
                      </button>

                      {/* Photo Thumbnail */}
                      <div className="relative shrink-0">
                        <div className="w-12 h-14 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 overflow-hidden flex items-center justify-center">
                          {st.photoUrl ? (
                            <img
                              src={st.photoUrl}
                              alt={st.firstName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Student Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                          {st.firstName} {st.lastName}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                          Adm: {st.admissionNumber}
                        </p>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-0.5">
                          {st.class?.name || 'Class N/A'}
                          {st.section?.name ? ` (${st.section.name})` : ''}
                        </p>
                      </div>
                    </div>

                    {/* Bottom quick actions */}
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-400">
                        {st.bloodGroup ? `Blood: ${st.bloodGroup}` : 'Blood: N/A'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPhotoModalStudent(st);
                        }}
                        className="px-2 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        {st.photoUrl ? 'Change Photo' : 'Add Photo'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Live Screen Preview Mode */
          <div className="space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Interactive Preview of <strong>{selectedStudents.length}</strong> student cards. Use{' '}
                <strong>Print Selected ID Cards</strong> to dispatch exact A4 sheets to your printer.
              </span>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition flex items-center gap-1.5 shadow-sm"
              >
                <Printer className="w-4 h-4" /> Send to Printer
              </button>
            </div>

            {selectedStudents.length === 0 ? (
              <div className="py-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <CreditCard className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                <p className="text-sm font-semibold">No students selected in queue</p>
                <button
                  onClick={() => setActiveTab('selector')}
                  className="mt-3 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Go to Selector & Pick Students
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 justify-center p-6 bg-slate-200 dark:bg-slate-900 rounded-2xl border border-slate-300 dark:border-slate-800 overflow-auto">
                {selectedStudents.map((st) => (
                  <div key={st.id} className="flex flex-col gap-2 items-center">
                    {(sideMode === 'front' || sideMode === 'duplex') && (
                      <StudentIdCard
                        student={st}
                        school={effectiveSchool}
                        orientation={orientation}
                        side="front"
                        onEditPhoto={(s) => setPhotoModalStudent(s)}
                      />
                    )}
                    {(sideMode === 'back' || sideMode === 'duplex') && (
                      <StudentIdCard
                        student={st}
                        school={effectiveSchool}
                        orientation={orientation}
                        side="back"
                        onEditPhoto={(s) => setPhotoModalStudent(s)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* =========================================================================
          PRINT ONLY CONTAINER (Rendered exclusively during window.print())
          Enforces exact A4 page packing (8 landscape or 9 portrait cards per sheet)
          with 5mm cutting gap and duplex reverse mirroring
         ========================================================================= */}
      <div id="printable-id-cards-sheet" className="print-only">
        {studentPages.map((pageStudents, pageIdx) => (
          <React.Fragment key={`page-${pageIdx}`}>
            {/* Front Sheet */}
            {(sideMode === 'front' || sideMode === 'duplex') && (
              <div
                className={`a4-print-sheet ${
                  orientation === 'landscape' ? 'landscape-grid' : 'portrait-grid'
                }`}
              >
                {pageStudents.map((st) => (
                  <div key={`front-${st.id}`} className="card-cell">
                    <StudentIdCard
                      student={st}
                      school={effectiveSchool}
                      orientation={orientation}
                      side="front"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Back Sheet (Mirrored horizontally for standard duplex printers) */}
            {(sideMode === 'back' || sideMode === 'duplex') && (
              <div
                className={`a4-print-sheet ${
                  orientation === 'landscape' ? 'landscape-grid' : 'portrait-grid'
                }`}
              >
                {/* For Duplex back-sheet alignment, reverse columns per row so cards match back-to-back */}
                {(() => {
                  const cols = orientation === 'landscape' ? 2 : 3;
                  const mirroredList: (CardStudent | null)[] = [];
                  for (let r = 0; r < pageStudents.length; r += cols) {
                    const rowChunk = pageStudents.slice(r, r + cols);
                    // Reverse the row so left meets right on back sheet
                    const reversedChunk = [...rowChunk].reverse();
                    mirroredList.push(...reversedChunk);
                  }
                  return mirroredList.map((st, mIdx) => (
                    <div key={`back-${st?.id || mIdx}`} className="card-cell">
                      {st && (
                        <StudentIdCard
                          student={st}
                          school={effectiveSchool}
                          orientation={orientation}
                          side="back"
                        />
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* School Logo Upload Modal */}
      <SchoolLogoUploadModal
        isOpen={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        currentLogoUrl={activeSchoolLogo}
        onLogoUpdated={(newLogoUrl) => setActiveSchoolLogo(newLogoUrl)}
      />

      {/* Dual Photo Capture & Upload Modal */}
      {photoModalStudent && (
        <StudentPhotoCaptureModal
          isOpen={!!photoModalStudent}
          onClose={() => setPhotoModalStudent(null)}
          student={photoModalStudent}
          onPhotoSaved={(newPhotoUrl) => {
            // Update local state
            setStudents((prev) =>
              prev.map((s) => (s.id === photoModalStudent.id ? { ...s, photoUrl: newPhotoUrl } : s))
            );
          }}
        />
      )}
    </div>
  );
};

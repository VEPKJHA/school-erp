import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Users,
  MapPin,
  GraduationCap,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileCheck,
} from 'lucide-react';
import { AdmissionService } from '../../services/admission.service';
import { ClassService } from '../../services/class.service';
import { AcademicService } from '../../services/academic.service';
import { ClassItem, AcademicSession, Gender, ParentRelation } from '../../types';
import { useToast } from '../../context/ToastContext';

export const NewAdmissionPage: React.FC = () => {
  const navigate = useNavigate();
  const { success, error } = useToast();

  const [currentStep, setCurrentStep] = useState(1);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedAppNumber, setSubmittedAppNumber] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    // Step 1: Student Demographics
    firstName: '',
    middleName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'MALE' as Gender,
    bloodGroup: '',
    nationality: 'Indian',
    category: 'General',
    religion: '',
    aadhaarNumber: '',

    // Step 2: Parent / Guardian
    parentName: '',
    parentRelation: 'FATHER' as ParentRelation,
    parentMobile: '',
    parentEmail: '',
    parentOccupation: '',

    // Step 3: Address
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',

    // Step 4: Academic Details
    academicSessionId: '',
    applyingClassId: '',
    previousSchoolName: '',
    previousClass: '',
    previousPercentage: '',
    remarks: '',
  });

  useEffect(() => {
    const loadMetadata = async () => {
      setIsLoadingMetadata(true);
      try {
        const [cls, sess] = await Promise.all([
          ClassService.getClasses(),
          AcademicService.getSessions(),
        ]);
        setClasses(cls);
        setSessions(sess);

        // Pre-select current session if available
        const current = sess.find((s) => s.isCurrent);
        if (current) {
          setFormData((prev) => ({ ...prev, academicSessionId: current.id }));
        } else if (sess.length > 0) {
          setFormData((prev) => ({ ...prev, academicSessionId: sess[0].id }));
        }

        if (cls.length > 0) {
          setFormData((prev) => ({ ...prev, applyingClassId: cls[0].id }));
        }
      } catch (err: any) {
        error('Failed to load classes or academic sessions');
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    loadMetadata();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        error('Student first and last names are required');
        return false;
      }
      if (!formData.dateOfBirth) {
        error('Student date of birth is required');
        return false;
      }
    } else if (step === 2) {
      if (!formData.parentName.trim()) {
        error('Parent/Guardian full name is required');
        return false;
      }
      if (!formData.parentMobile.trim() || formData.parentMobile.trim().length < 5) {
        error('Valid parent contact number is required');
        return false;
      }
    } else if (step === 3) {
      if (!formData.addressLine1.trim() || !formData.city.trim() || !formData.state.trim() || !formData.postalCode.trim()) {
        error('Address line 1, city, state, and postal code are required');
        return false;
      }
    } else if (step === 4) {
      if (!formData.academicSessionId) {
        error('Please select an academic session');
        return false;
      }
      if (!formData.applyingClassId) {
        error('Please select the applying class');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (status: 'SUBMITTED' | 'DRAFT') => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        academicSessionId: formData.academicSessionId,
        applyingClassId: formData.applyingClassId,
        status,
        remarks: formData.remarks || undefined,

        firstName: formData.firstName.trim(),
        middleName: formData.middleName.trim() || undefined,
        lastName: formData.lastName.trim(),
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || undefined,
        nationality: formData.nationality || 'Indian',
        category: formData.category || undefined,
        religion: formData.religion || undefined,
        aadhaarNumber: formData.aadhaarNumber.trim() || undefined,

        parentName: formData.parentName.trim(),
        parentRelation: formData.parentRelation,
        parentMobile: formData.parentMobile.trim(),
        parentEmail: formData.parentEmail.trim() || undefined,
        parentOccupation: formData.parentOccupation.trim() || undefined,

        addressLine1: formData.addressLine1.trim(),
        addressLine2: formData.addressLine2.trim() || undefined,
        city: formData.city.trim(),
        state: formData.state.trim(),
        postalCode: formData.postalCode.trim(),
      };

      const result = await AdmissionService.createAdmission(payload);
      setSubmittedAppNumber(result.applicationNumber);
      success(
        status === 'SUBMITTED'
          ? `Application registered successfully! Application No: ${result.applicationNumber}`
          : `Draft saved successfully! Application No: ${result.applicationNumber}`
      );
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to submit admission application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { num: 1, title: 'Student', icon: User },
    { num: 2, title: 'Parents', icon: Users },
    { num: 3, title: 'Address', icon: MapPin },
    { num: 4, title: 'Academic', icon: GraduationCap },
    { num: 5, title: 'Review', icon: FileCheck },
  ];

  if (isLoadingMetadata) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-sm text-slate-500 font-medium">Preparing admission application form...</p>
      </div>
    );
  }

  // Success view
  if (submittedAppNumber) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Application Registered Successfully!</h2>
        <p className="text-sm text-slate-500 mt-2">
          The admission application has been recorded in the school system with application identifier:
        </p>
        <div className="inline-block my-5 px-6 py-3 bg-indigo-50 border border-indigo-200 rounded-xl font-mono text-xl font-bold text-indigo-700">
          {submittedAppNumber}
        </div>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-8">
          The application is now queued for document verification and section allotment review by the school administration.
        </p>

        <div className="flex justify-center space-x-4">
          <button
            onClick={() => navigate('/admissions')}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-sm transition-colors cursor-pointer"
          >
            Go to Admissions List
          </button>
          <button
            onClick={() => {
              setSubmittedAppNumber(null);
              setCurrentStep(1);
              setFormData((prev) => ({
                ...prev,
                firstName: '',
                middleName: '',
                lastName: '',
                dateOfBirth: '',
                parentName: '',
                parentMobile: '',
                parentEmail: '',
                addressLine1: '',
                addressLine2: '',
                city: '',
                state: '',
                postalCode: '',
              }));
            }}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm transition-colors cursor-pointer shadow-sm shadow-indigo-600/20"
          >
            Register Another Student
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/admissions')}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200 shadow-sm transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              New Student Admission Registration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter applicant information to generate application dossier and sequential ID
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {steps.map((st) => {
            const Icon = st.icon;
            const isCompleted = currentStep > st.num;
            const isCurrent = currentStep === st.num;
            return (
              <div
                key={st.num}
                className={`flex items-center space-x-2.5 p-2 rounded-lg transition-all ${
                  isCurrent
                    ? 'bg-indigo-50 border border-indigo-200 text-indigo-700'
                    : isCompleted
                    ? 'text-emerald-700'
                    : 'text-slate-400'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : st.num}
                </div>
                <div className="hidden sm:block truncate">
                  <p className="text-xs font-semibold leading-none">{st.title}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Form Content Body */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        {/* Step 1: Student Demographics */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Student Profile & Demographics</h2>
              <p className="text-xs text-slate-500 mt-0.5">Personal details of the applicant child</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Aarav"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  placeholder="e.g. Kumar"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Sharma"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Blood Group
                </label>
                <select
                  name="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Nationality
                </label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Religion
                </label>
                <input
                  type="text"
                  name="religion"
                  value={formData.religion}
                  onChange={handleChange}
                  placeholder="e.g. Hinduism, Islam, etc."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Aadhaar Card Number
                </label>
                <input
                  type="text"
                  name="aadhaarNumber"
                  value={formData.aadhaarNumber}
                  onChange={handleChange}
                  placeholder="12-digit Aadhaar UID"
                  maxLength={16}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Parent / Guardian */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Parent / Guardian Information</h2>
              <p className="text-xs text-slate-500 mt-0.5">Primary emergency and communication contact</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Parent / Guardian Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="parentName"
                  value={formData.parentName}
                  onChange={handleChange}
                  placeholder="e.g. Sunil Sharma"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <select
                  name="parentRelation"
                  value={formData.parentRelation}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="FATHER">Father</option>
                  <option value="MOTHER">Mother</option>
                  <option value="GUARDIAN">Guardian</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Contact Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="parentMobile"
                  value={formData.parentMobile}
                  onChange={handleChange}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="parentEmail"
                  value={formData.parentEmail}
                  onChange={handleChange}
                  placeholder="parent@example.com"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Occupation / Organization
                </label>
                <input
                  type="text"
                  name="parentOccupation"
                  value={formData.parentOccupation}
                  onChange={handleChange}
                  placeholder="e.g. Senior Software Engineer / Government Service"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Residential Address */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Residential Address</h2>
              <p className="text-xs text-slate-500 mt-0.5">Physical residence for school transport and records</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Address Line 1 <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="addressLine1"
                  value={formData.addressLine1}
                  onChange={handleChange}
                  placeholder="House/Flat No., Building Name, Street"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleChange}
                  placeholder="Locality, Landmark, Area"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  City <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Delhi / Bengaluru"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  State <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="e.g. Delhi / Karnataka"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Postal Code / PIN <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleChange}
                  placeholder="e.g. 110001"
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Academic Details */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Academic Allotment Details</h2>
              <p className="text-xs text-slate-500 mt-0.5">Select class level and target academic session</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Academic Session <span className="text-rose-500">*</span>
                </label>
                <select
                  name="academicSessionId"
                  value={formData.academicSessionId}
                  onChange={handleChange}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {sessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isCurrent ? '(Current Session)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Applying Class <span className="text-rose-500">*</span>
                </label>
                <select
                  name="applyingClassId"
                  value={formData.applyingClassId}
                  onChange={handleChange}
                  required
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Previous School Name (if any)
                </label>
                <input
                  type="text"
                  name="previousSchoolName"
                  value={formData.previousSchoolName}
                  onChange={handleChange}
                  placeholder="e.g. St. Xavier High School"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Previous Class / Grade
                </label>
                <input
                  type="text"
                  name="previousClass"
                  value={formData.previousClass}
                  onChange={handleChange}
                  placeholder="e.g. Class 4"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Previous Percentage / Marks
                </label>
                <input
                  type="text"
                  name="previousPercentage"
                  value={formData.previousPercentage}
                  onChange={handleChange}
                  placeholder="e.g. 88.5%"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Admission Notes / Remarks
                </label>
                <textarea
                  name="remarks"
                  rows={2}
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Special considerations, concessions, transport requirements..."
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">Review Application Dossier</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify details before registering the application in the system
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  Student Information
                </span>
                <p className="text-slate-800 font-bold text-sm">
                  {formData.firstName} {formData.middleName} {formData.lastName}
                </p>
                <p className="text-slate-600">DOB: {formData.dateOfBirth} • {formData.gender}</p>
                <p className="text-slate-600">
                  Blood Group: {formData.bloodGroup || 'N/A'} • Category: {formData.category}
                </p>
                <p className="text-slate-600">Aadhaar: {formData.aadhaarNumber || 'Not provided'}</p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  Academic Allotment
                </span>
                <p className="text-slate-800 font-bold text-sm">
                  Class: {classes.find((c) => c.id === formData.applyingClassId)?.name || 'N/A'}
                </p>
                <p className="text-slate-600">
                  Session: {sessions.find((s) => s.id === formData.academicSessionId)?.name || 'N/A'}
                </p>
                {formData.previousSchoolName && (
                  <p className="text-slate-600">Prev School: {formData.previousSchoolName}</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  Parent / Guardian Contact
                </span>
                <p className="text-slate-800 font-bold text-sm">
                  {formData.parentName} ({formData.parentRelation})
                </p>
                <p className="text-slate-600">Mobile: {formData.parentMobile}</p>
                {formData.parentEmail && <p className="text-slate-600">Email: {formData.parentEmail}</p>}
                {formData.parentOccupation && (
                  <p className="text-slate-600">Occupation: {formData.parentOccupation}</p>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  Residential Address
                </span>
                <p className="text-slate-800 font-medium">
                  {formData.addressLine1}
                  {formData.addressLine2 ? `, ${formData.addressLine2}` : ''}
                </p>
                <p className="text-slate-600">
                  {formData.city}, {formData.state} — {formData.postalCode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step Navigation Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors cursor-pointer"
            >
              Previous Step
            </button>
          ) : (
            <div />
          )}

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm transition-colors cursor-pointer"
            >
              Next Step
            </button>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={() => handleSubmit('DRAFT')}
                disabled={isSubmitting}
                className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSubmit('SUBMITTED')}
                disabled={isSubmitting}
                className="flex items-center space-x-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium shadow-sm shadow-indigo-600/20 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Submit Application</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

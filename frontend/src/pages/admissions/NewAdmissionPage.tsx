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

    // Previous School Details
    previousSchool: '',
    previousClassAndBoard: '',
    tcNumber: '',

    // Step 2: Parent / Guardian (Specific fields as per school form)
    fatherName: '',
    fatherOccupation: '',
    fatherMobile: '',
    motherName: '',
    motherOccupation: '',
    motherMobile: '',
    guardianName: '',
    guardianMobile: '',
    parentEmail: '',

    // Step 3: Address & Emergency
    villageTown: '',
    postOffice: '',
    policeStation: '',
    district: '',
    state: 'Bihar',
    postalCode: '',
    addressLine1: '',

    // Emergency Contact
    emergencyContactName: '',
    emergencyContactRelation: '',
    emergencyContactMobile: '',

    // Step 4: Transport & Academic Details
    transportRequired: false,
    pickupPoint: '',
    transportSlab: '0-10',
    transportDistanceKm: '',
    transportInstructions: '',

    academicSessionId: '',
    applyingClassId: '',
    remarks: '',

    // Step 5: Document checklist items
    docBirthCert: false,
    docAadhaar: false,
    docPhotos: false,
    docReportCard: false,
    docTC: false,
    docParentId: false,
    docCasteEws: false,
    docOther: '',
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
        error('Student first and last names are required / विद्यार्थी का पूरा नाम आवश्यक है');
        return false;
      }
      if (!formData.dateOfBirth) {
        error('Student date of birth is required / जन्म तिथि आवश्यक है');
        return false;
      }
    } else if (step === 2) {
      if (!formData.fatherName.trim() && !formData.motherName.trim() && !formData.guardianName.trim()) {
        error("At least Father's, Mother's or Guardian's name is required / पिता अथवा माता का नाम आवश्यक है");
        return false;
      }
      const contactNo = formData.fatherMobile || formData.motherMobile || formData.guardianMobile;
      if (!contactNo || contactNo.trim().length < 5) {
        error('Valid contact mobile number is required / मोबाइल नंबर आवश्यक है');
        return false;
      }
    } else if (step === 3) {
      if (!formData.villageTown.trim() && !formData.addressLine1.trim()) {
        error('Village / Town or Address is required / पता अथवा गाँव का नाम आवश्यक है');
        return false;
      }
    } else if (step === 4) {
      if (!formData.academicSessionId) {
        error('Please select an academic session / शैक्षणिक सत्र चुनें');
        return false;
      }
      if (!formData.applyingClassId) {
        error('Please select the applying class / कक्षा चुनें');
        return false;
      }
      if (formData.transportRequired && !formData.pickupPoint.trim()) {
        error('Please enter pickup point for transport / वाहन हेतु चढ़ने का स्थान लिखें');
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
      const primaryParentName =
        formData.fatherName.trim() ||
        formData.motherName.trim() ||
        formData.guardianName.trim() ||
        'Parent';
      const primaryRelation = formData.fatherName.trim()
        ? 'FATHER'
        : formData.motherName.trim()
        ? 'MOTHER'
        : 'GUARDIAN';
      const primaryMobile =
        formData.fatherMobile.trim() ||
        formData.motherMobile.trim() ||
        formData.guardianMobile.trim() ||
        '9999999999';

      const checklistObj = {
        birthCertificate: formData.docBirthCert,
        aadhaarCopy: formData.docAadhaar,
        passportPhotos: formData.docPhotos,
        previousReportCard: formData.docReportCard,
        transferCertificate: formData.docTC,
        parentId: formData.docParentId,
        casteEws: formData.docCasteEws,
        other: formData.docOther,
      };

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

        previousSchool: formData.previousSchool.trim() || undefined,
        previousClassAndBoard: formData.previousClassAndBoard.trim() || undefined,
        tcNumber: formData.tcNumber.trim() || undefined,

        parentName: primaryParentName,
        parentRelation: primaryRelation,
        parentMobile: primaryMobile,
        parentEmail: formData.parentEmail.trim() || undefined,
        parentOccupation: formData.fatherOccupation || formData.motherOccupation || undefined,

        fatherName: formData.fatherName.trim() || undefined,
        fatherOccupation: formData.fatherOccupation.trim() || undefined,
        fatherMobile: formData.fatherMobile.trim() || undefined,
        motherName: formData.motherName.trim() || undefined,
        motherOccupation: formData.motherOccupation.trim() || undefined,
        motherMobile: formData.motherMobile.trim() || undefined,
        guardianName: formData.guardianName.trim() || undefined,
        guardianMobile: formData.guardianMobile.trim() || undefined,

        villageTown: formData.villageTown.trim() || undefined,
        postOffice: formData.postOffice.trim() || undefined,
        policeStation: formData.policeStation.trim() || undefined,
        district: formData.district.trim() || undefined,
        addressLine1: formData.addressLine1.trim() || formData.villageTown.trim() || 'N/A',
        city: formData.district.trim() || 'Supaul',
        state: formData.state.trim() || 'Bihar',
        postalCode: formData.postalCode.trim() || '852215',

        emergencyContactName: formData.emergencyContactName.trim() || undefined,
        emergencyContactRelation: formData.emergencyContactRelation.trim() || undefined,
        emergencyContactMobile: formData.emergencyContactMobile.trim() || undefined,

        transportRequired: formData.transportRequired,
        pickupPoint: formData.pickupPoint.trim() || undefined,
        transportSlab: formData.transportRequired ? formData.transportSlab : undefined,
        transportDistanceKm:
          formData.transportRequired && formData.transportDistanceKm
            ? Number(formData.transportDistanceKm)
            : undefined,
        transportInstructions: formData.transportInstructions.trim() || undefined,
        documentsChecklist: JSON.stringify(checklistObj),
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

              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Aadhaar Card No. / आधार संख्या
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

              {/* Previous Schooling Information */}
              <div className="sm:col-span-3 pt-3 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                  Previous Schooling / पूर्व विद्यालय विवरण
                </h3>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Previous School Name / पूर्व विद्यालय
                </label>
                <input
                  type="text"
                  name="previousSchool"
                  value={formData.previousSchool}
                  onChange={handleChange}
                  placeholder="Name and location of previous school"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Previous Class & Board / पिछली कक्षा एवं बोर्ड
                </label>
                <input
                  type="text"
                  name="previousClassAndBoard"
                  value={formData.previousClassAndBoard}
                  onChange={handleChange}
                  placeholder="e.g. Class 2 - CBSE / State Board"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Transfer Certificate (TC) No. / स्थानांतरण प्रमाण-पत्र संख्या
                </label>
                <input
                  type="text"
                  name="tcNumber"
                  value={formData.tcNumber}
                  onChange={handleChange}
                  placeholder="TC Reference / Serial Number"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Parent / Guardian */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Parent / Guardian Details / माता-पिता / अभिभावक का विवरण
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete contact and occupation details for father, mother, and optional guardian
              </p>
            </div>

            {/* Father Details */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Father's Details / पिता का विवरण
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Father’s Name / पिता का नाम
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleChange}
                    placeholder="Full name of father"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Occupation / व्यवसाय
                  </label>
                  <input
                    type="text"
                    name="fatherOccupation"
                    value={formData.fatherOccupation}
                    onChange={handleChange}
                    placeholder="e.g. Business, Agriculture, Service"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Father’s Mobile / पिता का मोबाइल
                  </label>
                  <input
                    type="tel"
                    name="fatherMobile"
                    value={formData.fatherMobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Mother Details */}
            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                Mother's Details / माता का विवरण
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mother’s Name / माता का नाम
                  </label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName}
                    onChange={handleChange}
                    placeholder="Full name of mother"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Occupation / व्यवसाय
                  </label>
                  <input
                    type="text"
                    name="motherOccupation"
                    value={formData.motherOccupation}
                    onChange={handleChange}
                    placeholder="e.g. Homemaker, Teacher, Service"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Mother’s Mobile / माता का मोबाइल
                  </label>
                  <input
                    type="tel"
                    name="motherMobile"
                    value={formData.motherMobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Guardian & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Guardian Name (if applicable) / अभिभावक
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={handleChange}
                  placeholder="Only if other than parents"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Guardian Mobile / अभिभावक मोबाइल
                </label>
                <input
                  type="tel"
                  name="guardianMobile"
                  value={formData.guardianMobile}
                  onChange={handleChange}
                  placeholder="10-digit mobile"
                  className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Family Email Address (Optional)
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
            </div>
          </div>
        )}

        {/* Step 3: Address & Emergency Contact */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h2 className="text-base font-bold text-slate-900">
                Address & Emergency Contact / पता एवं आपातकालीन संपर्क
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Residential address for communication, student records and emergency contact
              </p>
            </div>

            <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-3">
              <h3 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                Residential Address / आवासीय पता
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Village / Town / गाँव / शहर <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="villageTown"
                    value={formData.villageTown}
                    onChange={handleChange}
                    placeholder="e.g. Fakirna"
                    required
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Post Office (P.O.) / डाकघर
                  </label>
                  <input
                    type="text"
                    name="postOffice"
                    value={formData.postOffice}
                    onChange={handleChange}
                    placeholder="Post office name"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Police Station (P.S.) / थाना
                  </label>
                  <input
                    type="text"
                    name="policeStation"
                    value={formData.policeStation}
                    onChange={handleChange}
                    placeholder="Police station jurisdiction"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    District / जिला
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    placeholder="e.g. Supaul"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    State / राज्य
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="e.g. Bihar"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PIN Code / पिन कोड
                  </label>
                  <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleChange}
                    placeholder="e.g. 852215"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-3">
              <h3 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                Emergency Contact / आपातकालीन संपर्क
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Contact Person Name / नाम
                  </label>
                  <input
                    type="text"
                    name="emergencyContactName"
                    value={formData.emergencyContactName}
                    onChange={handleChange}
                    placeholder="Emergency contact person"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Relationship / संबंध
                  </label>
                  <input
                    type="text"
                    name="emergencyContactRelation"
                    value={formData.emergencyContactRelation}
                    onChange={handleChange}
                    placeholder="e.g. Uncle, Grandparent, Neighbor"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Emergency Mobile / आपातकालीन मोबाइल
                  </label>
                  <input
                    type="tel"
                    name="emergencyContactMobile"
                    value={formData.emergencyContactMobile}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>
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

              {/* Transport Details Section */}
              <div className="sm:col-span-2 pt-4 border-t border-slate-100">
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        4. Transport Details / परिवहन विवरण
                      </h3>
                      <p className="text-xs text-slate-500">
                        Does the student require daily school bus / van transport facility?
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.transportRequired}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            transportRequired: e.target.checked,
                          }))
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      <span className="ml-2 text-xs font-bold text-slate-700">
                        {formData.transportRequired ? 'Yes / हाँ' : 'No / नहीं'}
                      </span>
                    </label>
                  </div>

                  {formData.transportRequired && (
                    <div className="space-y-3 pt-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Pickup Point / चढ़ने का स्थान <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="pickupPoint"
                            value={formData.pickupPoint}
                            onChange={handleChange}
                            placeholder="e.g. Fakirna Chowk, Supaul Market"
                            required={formData.transportRequired}
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Distance Slab (किमी श्रेणी व मासिक शुल्क) <span className="text-rose-500">*</span>
                          </label>
                          <select
                            name="transportSlab"
                            value={formData.transportSlab}
                            onChange={handleChange}
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-emerald-800"
                          >
                            <option value="0-10">0 – 10 km (₹1,800 / month)</option>
                            <option value="10-20">10 – 20 km (₹2,000 / month)</option>
                            <option value="20+">20+ km (₹2,200 / month)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Approx. Distance in KM (वैकल्पिक दूरी)
                          </label>
                          <input
                            type="number"
                            name="transportDistanceKm"
                            step="0.5"
                            min="0"
                            value={formData.transportDistanceKm}
                            onChange={(e) => {
                              const val = e.target.value;
                              const num = parseFloat(val);
                              let autoSlab = formData.transportSlab;
                              if (!isNaN(num) && num > 0) {
                                if (num <= 10) autoSlab = '0-10';
                                else if (num <= 20) autoSlab = '10-20';
                                else autoSlab = '20+';
                              }
                              setFormData((prev) => ({
                                ...prev,
                                transportDistanceKm: val,
                                transportSlab: autoSlab,
                              }));
                            }}
                            placeholder="e.g. 7.5"
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                          />
                          <span className="text-[11px] text-slate-500">
                            Entering KM will automatically select the slab above.
                          </span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">
                            Special Instructions / विशेष निर्देश
                          </label>
                          <input
                            type="text"
                            name="transportInstructions"
                            value={formData.transportInstructions}
                            onChange={handleChange}
                            placeholder="Drop off person, safety instructions"
                            className="w-full text-sm bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents Checklist Section */}
              <div className="sm:col-span-2 pt-2">
                <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    5. Documents Checklist / आवश्यक दस्तावेज
                  </h3>
                  <p className="text-xs text-slate-500">
                    Check documents physically submitted or verified at the time of admission:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.docBirthCert}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, docBirthCert: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">Birth Cert. / जन्म प्रमाण</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.docAadhaar}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, docAadhaar: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">Aadhaar Copy / आधार प्रति</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.docPhotos}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, docPhotos: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">Photos / फोटो</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.docReportCard}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, docReportCard: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">Report Card / अंक-पत्र</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.docTC}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, docTC: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">Transfer Cert. / TC</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.docParentId}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, docParentId: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">Parent ID / पहचान पत्र</span>
                    </label>

                    <label className="flex items-center space-x-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={formData.docCasteEws}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, docCasteEws: e.target.checked }))
                        }
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-slate-700 font-medium">Caste/EWS / जाति प्रमाण</span>
                    </label>

                    <div className="flex items-center p-1 bg-white rounded-lg border border-slate-200">
                      <input
                        type="text"
                        name="docOther"
                        value={formData.docOther}
                        onChange={handleChange}
                        placeholder="Other / अन्य दस्तावेज"
                        className="w-full text-xs px-2 py-1 bg-transparent focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Admission Notes / Remarks / टिप्पणी
                </label>
                <textarea
                  name="remarks"
                  rows={2}
                  value={formData.remarks}
                  onChange={handleChange}
                  placeholder="Special considerations, fee concession notes, medical info..."
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
              <h2 className="text-base font-bold text-slate-900">Review Application Dossier / आवेदन पूर्वावलोकन</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verify all details as per Shishu Niketan Admission Form before registering
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  1. Student Details / विद्यार्थी विवरण
                </span>
                <p className="text-slate-800 font-bold text-sm">
                  {formData.firstName} {formData.middleName} {formData.lastName}
                </p>
                <p className="text-slate-600">DOB: {formData.dateOfBirth} • {formData.gender}</p>
                <p className="text-slate-600">
                  Blood Group: {formData.bloodGroup || 'N/A'} • Category: {formData.category}
                </p>
                <p className="text-slate-600">Aadhaar: {formData.aadhaarNumber || 'Not provided'}</p>
                {formData.previousSchool && (
                  <p className="text-slate-600">Prev School: {formData.previousSchool} ({formData.previousClassAndBoard || 'N/A'})</p>
                )}
                {formData.tcNumber && <p className="text-slate-600">TC No: {formData.tcNumber}</p>}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  2. Parent & Contact Details / माता-पिता विवरण
                </span>
                {formData.fatherName && (
                  <p className="text-slate-800 font-medium">
                    Father: <span className="font-bold">{formData.fatherName}</span> ({formData.fatherOccupation || 'N/A'}) • {formData.fatherMobile || 'N/A'}
                  </p>
                )}
                {formData.motherName && (
                  <p className="text-slate-800 font-medium">
                    Mother: <span className="font-bold">{formData.motherName}</span> ({formData.motherOccupation || 'N/A'}) • {formData.motherMobile || 'N/A'}
                  </p>
                )}
                {formData.guardianName && (
                  <p className="text-slate-700">Guardian: {formData.guardianName} • {formData.guardianMobile}</p>
                )}
                {formData.parentEmail && <p className="text-slate-600">Email: {formData.parentEmail}</p>}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  3. Address & Emergency / पता एवं आपातकाल
                </span>
                <p className="text-slate-800 font-medium">
                  {formData.villageTown}, P.O: {formData.postOffice || 'N/A'}, P.S: {formData.policeStation || 'N/A'}
                </p>
                <p className="text-slate-600">
                  District: {formData.district || 'Supaul'}, State: {formData.state} - {formData.postalCode}
                </p>
                {formData.emergencyContactName && (
                  <p className="text-amber-800 font-medium pt-1 border-t border-slate-200">
                    Emergency: {formData.emergencyContactName} ({formData.emergencyContactRelation}) • {formData.emergencyContactMobile}
                  </p>
                )}
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <span className="font-semibold text-indigo-700 uppercase tracking-wider block">
                  4. Academic & Transport / कक्षा एवं परिवहन
                </span>
                <p className="text-slate-800 font-bold text-sm">
                  Class: {classes.find((c) => c.id === formData.applyingClassId)?.name || 'N/A'}
                </p>
                <p className="text-slate-600">
                  Session: {sessions.find((s) => s.id === formData.academicSessionId)?.name || 'N/A'}
                </p>
                <p className="text-emerald-700 font-semibold">
                  Transport Required: {formData.transportRequired ? `Yes (Pickup: ${formData.pickupPoint})` : 'No'}
                </p>
                <p className="text-slate-600">
                  Documents Verified: {[
                    formData.docBirthCert && 'Birth Cert',
                    formData.docAadhaar && 'Aadhaar',
                    formData.docPhotos && 'Photos',
                    formData.docReportCard && 'Report Card',
                    formData.docTC && 'TC',
                    formData.docParentId && 'Parent ID',
                    formData.docCasteEws && 'Caste/EWS',
                    formData.docOther && formData.docOther,
                  ].filter(Boolean).join(', ') || 'None selected'}
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

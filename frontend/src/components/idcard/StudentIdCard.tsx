import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, User, Phone, MapPin, ShieldAlert } from 'lucide-react';

export interface CardStudent {
  id: string;
  admissionNumber: string;
  rollNumber?: string | null;
  firstName: string;
  lastName: string;
  dateOfBirth?: string | Date | null;
  bloodGroup?: string | null;
  gender?: string | null;
  photoUrl?: string | null;
  emergencyContact?: string | null;
  class?: { name: string; code?: string };
  section?: { name: string };
  session?: { name: string };
  parents?: Array<{
    parent: {
      firstName: string;
      lastName: string;
      phone: string;
    };
  }>;
  addresses?: Array<{
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  }>;
}

export interface CardSchool {
  name: string;
  code?: string;
  logoUrl?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  email?: string | null;
  affiliationNumber?: string | null;
}

interface StudentIdCardProps {
  student: CardStudent;
  school?: CardSchool | null;
  orientation?: 'landscape' | 'portrait';
  side?: 'front' | 'back';
  onEditPhoto?: (student: CardStudent) => void;
  scale?: number;
}

export const StudentIdCard: React.FC<StudentIdCardProps> = ({
  student,
  school,
  orientation = 'landscape',
  side = 'front',
  onEditPhoto,
  scale = 1,
}) => {
  const fullName = `${student.firstName} ${student.lastName}`.trim();
  const className = student.class?.name || 'Class';
  const sectionName = student.section?.name ? ` - ${student.section.name}` : '';
  const primaryParent = student.parents?.[0]?.parent;
  const parentName = primaryParent ? `${primaryParent.firstName} ${primaryParent.lastName}`.trim() : null;
  const parentPhone = primaryParent?.phone || student.emergencyContact || 'N/A';
  const currentAddress = student.addresses?.[0];
  const formattedAddress = currentAddress
    ? `${currentAddress.addressLine1}, ${currentAddress.city}, ${currentAddress.state}`
    : school?.city
    ? `${school.city}, ${school.state || 'India'}`
    : 'Registered Campus Address';

  const dobStr = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A';

  // Real Structured Verification Payload for Gate Scanners & Verification App
  const verificationPayload = `EDUCORE|${school?.code || 'SCH'}|${student.admissionNumber}|${student.id}|${className}${sectionName}`;

  const isLandscape = orientation === 'landscape';

  // Strict ISO/IEC 7810 ID-1 (CR80) Dimensions:
  // Landscape: 85.6mm x 53.98mm
  // Portrait: 53.98mm x 85.6mm
  const cardStyle: React.CSSProperties = {
    width: isLandscape ? '85.6mm' : '53.98mm',
    height: isLandscape ? '53.98mm' : '85.6mm',
    minWidth: isLandscape ? '85.6mm' : '53.98mm',
    maxWidth: isLandscape ? '85.6mm' : '53.98mm',
    minHeight: isLandscape ? '53.98mm' : '85.6mm',
    maxHeight: isLandscape ? '53.98mm' : '85.6mm',
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top left',
    boxSizing: 'border-box',
    pageBreakInside: 'avoid',
    breakInside: 'avoid',
    WebkitPrintColorAdjust: 'exact',
    printColorAdjust: 'exact',
  };

  // -------------------------------------------------------------
  // BACK SIDE (CR80 Reverse: Safety, Helpline, Address, Prominent QR)
  // -------------------------------------------------------------
  if (side === 'back') {
    return (
      <div
        className="cr80-card relative bg-white text-slate-900 rounded-[3.18mm] overflow-hidden border border-slate-300 shadow-sm flex flex-col justify-between p-[2.5mm] select-none"
        style={cardStyle}
      >
        {/* Top Header stripe */}
        <div className="border-b border-indigo-200 pb-[1.2mm] flex items-center justify-between">
          <div className="overflow-hidden">
            <h4 className="text-[7.5pt] font-black uppercase tracking-wider text-indigo-950 truncate max-w-[55mm] leading-tight">
              {school?.name || 'EduCore Global Academy'}
            </h4>
            <p className="text-[5pt] text-indigo-700 font-semibold leading-none mt-[0.4mm]">
              Official Student Safety & Identity Card
            </p>
          </div>
          <div className="w-[4.2mm] h-[4.2mm] rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-[2.8mm] h-[2.8mm] text-indigo-700" />
          </div>
        </div>

        {/* Middle Info + Prominent QR Code (22mm x 22mm) */}
        <div className="flex-1 my-[1.2mm] flex gap-[2mm] items-center justify-between overflow-hidden">
          <div className="flex-1 space-y-[1.2mm] text-[6pt]">
            {parentName && (
              <div>
                <span className="text-[4.8pt] font-bold text-slate-400 uppercase block leading-none mb-[0.3mm]">
                  Guardian / Father
                </span>
                <span className="font-bold text-slate-900 leading-tight block truncate">
                  {parentName}
                </span>
              </div>
            )}
            <div>
              <span className="text-[4.8pt] font-bold text-slate-400 uppercase flex items-center gap-[1mm] leading-none mb-[0.3mm]">
                <Phone className="w-[2.2mm] h-[2.2mm] text-emerald-600" /> Emergency Contact
              </span>
              <span className="font-bold text-slate-900 tracking-wide block">
                {parentPhone}
              </span>
            </div>
            <div>
              <span className="text-[4.8pt] font-bold text-slate-400 uppercase flex items-center gap-[1mm] leading-none mb-[0.3mm]">
                <MapPin className="w-[2.2mm] h-[2.2mm] text-rose-500" /> Residential Address
              </span>
              <span className="text-[5.2pt] font-medium text-slate-700 line-clamp-2 leading-tight block">
                {formattedAddress}
              </span>
            </div>
          </div>

          {/* Prominent Back QR Code (~22mm x 22mm) */}
          <div className="flex flex-col items-center justify-center shrink-0 border border-slate-200 bg-white p-[1mm] rounded-[1.8mm] shadow-xs">
            <QRCodeSVG
              value={verificationPayload}
              size={64}
              level="M"
              includeMargin={false}
              className="w-[20mm] h-[20mm]"
            />
            <span className="text-[4.5pt] font-mono font-black text-indigo-950 tracking-wider mt-[0.5mm] leading-none">
              {student.admissionNumber}
            </span>
          </div>
        </div>

        {/* Footer Instructions & Validity */}
        <div className="border-t border-slate-200 pt-[1mm] flex items-end justify-between text-[4.6pt] text-slate-500">
          <p className="max-w-[52mm] leading-tight text-[4.4pt]">
            If found, return to school office or call <strong>{school?.phone || 'Helpline'}</strong>.
            Property of institution.
          </p>
          <div className="text-right shrink-0">
            <span className="font-bold block text-indigo-900 leading-none">
              Session: {student.session?.name || '2026-27'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FRONT SIDE - LANDSCAPE (85.6mm x 53.98mm)
  // -------------------------------------------------------------
  if (isLandscape) {
    return (
      <div
        className="cr80-card group relative bg-white text-slate-900 rounded-[3.18mm] overflow-hidden border border-slate-300 shadow-sm flex flex-col justify-between p-[2.5mm] select-none"
        style={cardStyle}
      >
        {/* Top Header Banner */}
        <div className="absolute top-0 left-0 right-0 h-[14.5mm] bg-gradient-to-r from-indigo-950 via-indigo-900 to-indigo-950 flex items-center px-[3mm] gap-[2.8mm] shadow-xs">
          {school?.logoUrl ? (
            <div className="w-[12mm] h-[12mm] rounded-lg bg-white p-[0.6mm] shadow-xs shrink-0 flex items-center justify-center border border-white/40 overflow-hidden">
              <img
                src={school.logoUrl}
                alt={school.name}
                className="w-full h-full object-contain"
              />
            </div>
          ) : (
            <div className="w-[12mm] h-[12mm] rounded-lg bg-white text-indigo-950 font-black text-[7.5pt] flex items-center justify-center shrink-0 shadow-xs border border-white/40">
              {school?.name?.slice(0, 2)?.toUpperCase() || 'ED'}
            </div>
          )}
          <div className="text-white overflow-hidden flex-1">
            <h3 className="text-[7.8pt] font-black uppercase tracking-wide truncate leading-tight">
              {school?.name || 'EduCore Global Academy'}
            </h3>
            <p className="text-[5pt] text-indigo-200 font-medium truncate leading-none mt-[0.8mm]">
              {school?.city ? `${school.city}, ${school.state || 'India'}` : 'Affiliated to CBSE Board'}
              {student.session?.name ? ` • Session: ${student.session.name}` : ''}
            </p>
          </div>
        </div>

        {/* Spacer for banner */}
        <div className="h-[14mm]" />

        {/* Body content */}
        <div className="flex-1 flex gap-[2.5mm] items-center pt-[1mm] overflow-hidden">
          {/* Photo with locked dimensions */}
          <div className="relative shrink-0">
            <div className="w-[22mm] h-[26mm] rounded-[2mm] overflow-hidden border-2 border-indigo-700 bg-slate-100 flex items-center justify-center shrink-0">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                  style={{ width: '22mm', height: '26mm', objectFit: 'cover' }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <User className="w-[9mm] h-[9mm]" />
                  <span className="text-[4.5pt] font-semibold mt-[0.5mm]">No Photo</span>
                </div>
              )}
            </div>

            {/* Quick Edit Photo Hover Button (Hidden in print) */}
            {onEditPhoto && (
              <button
                type="button"
                onClick={() => onEditPhoto(student)}
                title="Update photo"
                className="no-print absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md opacity-90 group-hover:opacity-100 transition"
              >
                <Camera className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 space-y-[0.7mm] overflow-hidden">
            <div>
              <span className="text-[4.5pt] font-black uppercase text-indigo-700 tracking-wider block leading-none">
                Student
              </span>
              <h4 className="text-[8.5pt] font-black text-slate-900 leading-tight truncate">
                {fullName}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-x-[1.5mm] gap-y-[0.5mm] text-[5.6pt]">
              <div>
                <span className="text-[4.3pt] text-slate-400 uppercase block font-bold leading-none">Adm No.</span>
                <span className="font-bold text-indigo-950 font-mono">{student.admissionNumber}</span>
              </div>
              <div>
                <span className="text-[4.3pt] text-slate-400 uppercase block font-bold leading-none">Class & Sec</span>
                <span className="font-bold text-slate-900">{className}{sectionName}</span>
              </div>
              <div>
                <span className="text-[4.3pt] text-slate-400 uppercase block font-bold leading-none">DOB</span>
                <span className="font-bold text-slate-800">{dobStr}</span>
              </div>
              <div>
                <span className="text-[4.3pt] text-slate-400 uppercase block font-bold leading-none">Blood Group</span>
                <span className="font-bold text-rose-700">{student.bloodGroup || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Front Scannable QR (14mm x 14mm) + Principal Sign */}
        <div className="border-t border-slate-200 pt-[0.8mm] flex items-center justify-between text-[4.5pt]">
          <span className="text-slate-400 font-medium">EduCore ERP ID Verified</span>

          {/* Front QR Code (14mm x 14mm) */}
          <div className="flex items-center gap-[1.5mm]">
            <div className="border border-slate-200 bg-white p-[0.6mm] rounded-[1mm]">
              <QRCodeSVG
                value={verificationPayload}
                size={40}
                level="L"
                includeMargin={false}
                className="w-[12mm] h-[12mm]"
              />
            </div>
            <div className="flex flex-col items-center">
              <span className="font-serif italic text-[5.8pt] text-indigo-950 font-bold leading-none tracking-wider">
                {school?.name ? school.name.split(' ')[0] : 'Principal'}
              </span>
              <span className="text-[4pt] text-slate-500 uppercase tracking-widest font-bold mt-[0.3mm]">
                Authorized Sign
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // FRONT SIDE - PORTRAIT (53.98mm x 85.6mm)
  // -------------------------------------------------------------
  return (
    <div
      className="cr80-card group relative bg-white text-slate-900 rounded-[3.18mm] overflow-hidden border border-slate-300 shadow-sm flex flex-col justify-between p-[2.5mm] select-none"
      style={cardStyle}
    >
      {/* Top Header */}
      <div className="text-center border-b border-indigo-100 pb-[1.5mm] pt-[1mm] flex flex-col items-center">
        {school?.logoUrl ? (
          <div className="w-[12mm] h-[12mm] rounded-lg bg-white p-[0.6mm] shadow-xs mb-[1mm] flex items-center justify-center border border-indigo-100 overflow-hidden">
            <img
              src={school.logoUrl}
              alt={school.name}
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <div className="w-[12mm] h-[12mm] rounded-lg bg-indigo-950 text-white font-black text-[7.5pt] flex items-center justify-center mb-[1mm] shadow-xs">
            {school?.name?.slice(0, 2)?.toUpperCase() || 'ED'}
          </div>
        )}
        <h3 className="text-[7.2pt] font-black uppercase tracking-wide text-indigo-950 truncate px-[1mm] leading-tight max-w-[48mm]">
          {school?.name || 'EduCore Global Academy'}
        </h3>
        <p className="text-[4.8pt] text-indigo-600 font-bold mt-[0.5mm] leading-none">
          {student.session?.name ? `Session ${student.session.name}` : 'Student Identity Card'}
        </p>
      </div>

      {/* Portrait Photo with locked size */}
      <div className="relative mx-auto my-[1.2mm]">
        <div className="w-[22mm] h-[26mm] rounded-[2mm] overflow-hidden border-2 border-indigo-700 bg-slate-100 flex items-center justify-center shrink-0">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={fullName}
              className="w-full h-full object-cover"
              style={{ width: '22mm', height: '26mm', objectFit: 'cover' }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <User className="w-[9mm] h-[9mm]" />
              <span className="text-[4.5pt] font-semibold mt-[0.5mm]">No Photo</span>
            </div>
          )}
        </div>

        {onEditPhoto && (
          <button
            type="button"
            onClick={() => onEditPhoto(student)}
            title="Update photo"
            className="no-print absolute -bottom-1 -right-1 p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md opacity-90 group-hover:opacity-100 transition"
          >
            <Camera className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Name and Grade */}
      <div className="text-center">
        <h4 className="text-[8pt] font-black text-slate-900 truncate leading-tight">
          {fullName}
        </h4>
        <div className="inline-block px-[2mm] py-[0.4mm] rounded-full bg-indigo-50 border border-indigo-200 text-indigo-950 text-[5.2pt] font-bold mt-[0.6mm]">
          {className}{sectionName}
        </div>
      </div>

      {/* Student Details Grid */}
      <div className="space-y-[0.6mm] bg-slate-50 p-[1.2mm] rounded-[1.5mm] text-[5.2pt] border border-slate-100 my-[0.8mm]">
        <div className="flex justify-between">
          <span className="text-slate-400 font-bold uppercase text-[4.5pt]">Adm No:</span>
          <span className="font-bold text-slate-900 font-mono">{student.admissionNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-bold uppercase text-[4.5pt]">DOB:</span>
          <span className="font-bold text-slate-800">{dobStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400 font-bold uppercase text-[4.5pt]">Blood:</span>
          <span className="font-bold text-rose-700">{student.bloodGroup || 'N/A'}</span>
        </div>
      </div>

      {/* Footer with Front QR + Authorized Signature */}
      <div className="border-t border-slate-200 pt-[0.8mm] flex justify-between items-end text-[4.5pt]">
        <div className="border border-slate-200 bg-white p-[0.5mm] rounded-[1mm]">
          <QRCodeSVG
            value={verificationPayload}
            size={36}
            level="L"
            includeMargin={false}
            className="w-[11mm] h-[11mm]"
          />
        </div>
        <div className="text-right">
          <span className="font-serif italic text-[5.6pt] text-indigo-950 font-bold block leading-none">
            {school?.name ? school.name.split(' ')[0] : 'Principal'}
          </span>
          <span className="text-[4pt] text-slate-500 uppercase tracking-wider font-bold">
            Principal Sign
          </span>
        </div>
      </div>
    </div>
  );
};

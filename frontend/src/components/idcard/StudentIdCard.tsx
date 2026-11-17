import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Camera, User, Phone, MapPin, Calendar, Heart, ShieldAlert } from 'lucide-react';

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
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  useEffect(() => {
    const payload = JSON.stringify({
      type: 'EDUCORE_STUDENT_ID',
      schoolCode: school?.code || 'EDUCORE',
      admNo: student.admissionNumber,
      id: student.id,
      name: `${student.firstName} ${student.lastName}`,
    });

    QRCode.toDataURL(payload, {
      margin: 1,
      width: 120,
      color: {
        dark: '#1e1b4b',
        light: '#ffffff',
      },
    })
      .then((url) => setQrCodeUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [student, school]);

  const fullName = `${student.firstName} ${student.lastName}`.trim();
  const className = student.class?.name || 'Class N/A';
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

  // Strict ISO CR80 Dimensions
  // Landscape: 85.6mm x 53.98mm
  // Portrait: 53.98mm x 85.6mm
  const isLandscape = orientation === 'landscape';

  const cardContainerStyle: React.CSSProperties = {
    width: isLandscape ? '85.6mm' : '53.98mm',
    height: isLandscape ? '53.98mm' : '85.6mm',
    minWidth: isLandscape ? '85.6mm' : '53.98mm',
    minHeight: isLandscape ? '53.98mm' : '85.6mm',
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top left',
  };

  if (side === 'back') {
    return (
      <div
        className="id-card-element relative bg-gradient-to-br from-slate-50 via-white to-slate-100 text-slate-800 rounded-[3.18mm] overflow-hidden border border-slate-300 shadow-md flex flex-col justify-between p-[2.5mm] box-border select-none print:shadow-none print:border-slate-400 print:m-0"
        style={cardContainerStyle}
      >
        {/* Top Header stripe */}
        <div className="border-b border-indigo-200 pb-[1.5mm] flex items-center justify-between">
          <div>
            <h4 className="text-[7.5pt] font-extrabold uppercase tracking-wider text-indigo-950 truncate max-w-[55mm]">
              {school?.name || 'EduCore Global Academy'}
            </h4>
            <p className="text-[5.5pt] text-indigo-700 font-medium">Student Identity & Safety Card</p>
          </div>
          <div className="w-[4mm] h-[4mm] rounded-full bg-indigo-600/10 flex items-center justify-center">
            <ShieldAlert className="w-[2.8mm] h-[2.8mm] text-indigo-700" />
          </div>
        </div>

        {/* Middle Info + QR Code */}
        <div className="flex-1 my-[1.5mm] flex gap-[2mm] items-center">
          <div className="flex-1 space-y-[1.2mm] text-[6pt]">
            {parentName && (
              <div>
                <span className="text-[5pt] font-semibold text-slate-500 uppercase block">Guardian</span>
                <span className="font-bold text-slate-800 leading-tight block truncate">{parentName}</span>
              </div>
            )}
            <div>
              <span className="text-[5pt] font-semibold text-slate-500 uppercase flex items-center gap-[1mm]">
                <Phone className="w-[2.2mm] h-[2.2mm] text-emerald-600" /> Emergency Helpline
              </span>
              <span className="font-bold text-slate-900 tracking-wide">{parentPhone}</span>
            </div>
            <div>
              <span className="text-[5pt] font-semibold text-slate-500 uppercase flex items-center gap-[1mm]">
                <MapPin className="w-[2.2mm] h-[2.2mm] text-rose-500" /> Residential Address
              </span>
              <span className="text-[5.5pt] font-medium text-slate-700 line-clamp-2 leading-tight">
                {formattedAddress}
              </span>
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center justify-center shrink-0 border border-slate-200 bg-white p-[1mm] rounded-[1.5mm] shadow-xs">
            {qrCodeUrl ? (
              <img src={qrCodeUrl} alt="QR Code" className="w-[18mm] h-[18mm] object-contain" />
            ) : (
              <div className="w-[18mm] h-[18mm] bg-slate-100 flex items-center justify-center text-[5pt] text-slate-400">
                QR
              </div>
            )}
            <span className="text-[4.5pt] font-mono font-bold text-slate-600 tracking-widest mt-[0.5mm]">
              {student.admissionNumber}
            </span>
          </div>
        </div>

        {/* Footer Instructions & Validity */}
        <div className="border-t border-slate-200 pt-[1mm] flex items-end justify-between text-[4.8pt] text-slate-500">
          <p className="max-w-[50mm] leading-tight">
            If found, please return to school office or call <strong>{school?.phone || 'Helpline'}</strong>.
            Non-transferable.
          </p>
          <div className="text-right">
            <span className="font-semibold block text-indigo-900">Valid: {student.session?.name || '2026-27'}</span>
          </div>
        </div>
      </div>
    );
  }

  // FRONT SIDE (Landscape vs Portrait)
  if (isLandscape) {
    return (
      <div
        className="id-card-element group relative bg-white text-slate-800 rounded-[3.18mm] overflow-hidden border border-slate-300 shadow-md flex flex-col justify-between p-[2.5mm] box-border select-none print:shadow-none print:border-slate-400 print:m-0"
        style={cardContainerStyle}
      >
        {/* Top Header Background wave */}
        <div className="absolute top-0 left-0 right-0 h-[13mm] bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 flex items-center px-[3mm] gap-[2.5mm]">
          {school?.logoUrl ? (
            <img
              src={school.logoUrl}
              alt="Logo"
              className="w-[8.5mm] h-[8.5mm] rounded-full object-contain bg-white p-[0.4mm] shadow-xs shrink-0"
            />
          ) : (
            <div className="w-[8.5mm] h-[8.5mm] rounded-full bg-white text-indigo-900 font-black text-[6pt] flex items-center justify-center shrink-0 shadow-xs">
              {school?.name?.charAt(0) || 'E'}
            </div>
          )}
          <div className="text-white overflow-hidden flex-1">
            <h3 className="text-[7.5pt] font-black uppercase tracking-wide truncate leading-tight">
              {school?.name || 'EduCore Global Academy'}
            </h3>
            <p className="text-[5pt] text-indigo-200 font-medium truncate leading-none mt-[0.6mm]">
              {school?.city ? `${school.city}, ${school.state || 'India'}` : 'Affiliated to CBSE Board'}
              {student.session?.name ? ` • Session: ${student.session.name}` : ''}
            </p>
          </div>
        </div>

        {/* Spacer for header */}
        <div className="h-[12.5mm]" />

        {/* Body content */}
        <div className="flex-1 flex gap-[2.5mm] items-center pt-[1.5mm]">
          {/* Photo */}
          <div className="relative shrink-0">
            <div className="w-[20mm] h-[24mm] rounded-[2mm] overflow-hidden border-2 border-indigo-700 shadow-xs bg-slate-100 flex items-center justify-center">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-slate-400">
                  <User className="w-[8mm] h-[8mm]" />
                  <span className="text-[4.5pt] font-medium mt-[0.5mm]">No Photo</span>
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
          <div className="flex-1 space-y-[0.8mm]">
            <div>
              <span className="text-[4.8pt] font-extrabold uppercase text-indigo-700 tracking-wider">
                Student
              </span>
              <h4 className="text-[8.5pt] font-black text-slate-900 leading-tight truncate">
                {fullName}
              </h4>
            </div>

            <div className="grid grid-cols-2 gap-x-[1.5mm] gap-y-[0.6mm] text-[5.8pt]">
              <div>
                <span className="text-[4.5pt] text-slate-400 uppercase block font-semibold">Adm No.</span>
                <span className="font-bold text-indigo-950 font-mono">{student.admissionNumber}</span>
              </div>
              <div>
                <span className="text-[4.5pt] text-slate-400 uppercase block font-semibold">Class & Sec</span>
                <span className="font-bold text-slate-900">{className}{sectionName}</span>
              </div>
              <div>
                <span className="text-[4.5pt] text-slate-400 uppercase block font-semibold">DOB</span>
                <span className="font-bold text-slate-800">{dobStr}</span>
              </div>
              <div>
                <span className="text-[4.5pt] text-slate-400 uppercase block font-semibold">Blood Group</span>
                <span className="font-bold text-rose-700">{student.bloodGroup || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Principal Signature */}
        <div className="border-t border-slate-200 pt-[0.8mm] flex items-center justify-between text-[4.5pt]">
          <span className="text-slate-400 font-medium">EduCore ERP ID Verified</span>
          <div className="flex flex-col items-center">
            <span className="font-serif italic text-[6pt] text-indigo-900 font-bold leading-none tracking-wider">
              {school?.name ? school.name.split(' ')[0] : 'Principal'}
            </span>
            <span className="text-[4.2pt] text-slate-500 uppercase tracking-widest font-semibold mt-[0.4mm]">
              Authorized Signatory
            </span>
          </div>
        </div>
      </div>
    );
  }

  // FRONT SIDE (Portrait Mode: 53.98mm x 85.6mm)
  return (
    <div
      className="id-card-element group relative bg-white text-slate-800 rounded-[3.18mm] overflow-hidden border border-slate-300 shadow-md flex flex-col justify-between p-[2.5mm] box-border select-none print:shadow-none print:border-slate-400 print:m-0"
      style={cardContainerStyle}
    >
      {/* Top Header */}
      <div className="text-center border-b border-indigo-100 pb-[1.5mm] pt-[1mm]">
        {school?.logoUrl ? (
          <img
            src={school.logoUrl}
            alt="Logo"
            className="w-[9mm] h-[9mm] mx-auto rounded-full object-contain mb-[1mm]"
          />
        ) : (
          <div className="w-[8mm] h-[8mm] mx-auto rounded-full bg-indigo-900 text-white font-black text-[6pt] flex items-center justify-center mb-[1mm]">
            {school?.name?.charAt(0) || 'E'}
          </div>
        )}
        <h3 className="text-[7pt] font-black uppercase tracking-wide text-indigo-950 truncate px-[1mm] leading-tight">
          {school?.name || 'EduCore Global Academy'}
        </h3>
        <p className="text-[4.8pt] text-indigo-600 font-medium mt-[0.4mm]">
          {student.session?.name ? `Session ${student.session.name}` : 'Student Identity Card'}
        </p>
      </div>

      {/* Portrait Photo */}
      <div className="relative mx-auto my-[1.5mm]">
        <div className="w-[24mm] h-[28mm] rounded-[2mm] overflow-hidden border-2 border-indigo-700 shadow-xs bg-slate-100 flex items-center justify-center">
          {student.photoUrl ? (
            <img
              src={student.photoUrl}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-slate-400">
              <User className="w-[10mm] h-[10mm]" />
              <span className="text-[5pt] font-medium mt-[0.5mm]">No Photo</span>
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

      {/* Name and Key Details */}
      <div className="text-center">
        <h4 className="text-[8pt] font-black text-slate-900 truncate leading-tight">
          {fullName}
        </h4>
        <div className="inline-block px-[2mm] py-[0.5mm] rounded-full bg-indigo-50 border border-indigo-200 text-indigo-900 text-[5.5pt] font-bold mt-[0.8mm]">
          {className}{sectionName}
        </div>
      </div>

      <div className="space-y-[0.8mm] bg-slate-50 p-[1.5mm] rounded-[1.5mm] text-[5.5pt] border border-slate-100 my-[1mm]">
        <div className="flex justify-between">
          <span className="text-slate-500 font-semibold">Adm No:</span>
          <span className="font-bold text-slate-900 font-mono">{student.admissionNumber}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-semibold">DOB:</span>
          <span className="font-bold text-slate-800">{dobStr}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500 font-semibold">Blood:</span>
          <span className="font-bold text-rose-700">{student.bloodGroup || 'N/A'}</span>
        </div>
      </div>

      {/* Authorized Signature */}
      <div className="border-t border-slate-200 pt-[0.8mm] flex justify-between items-end text-[4.5pt]">
        <span className="text-slate-400 font-medium">EduCore ERP</span>
        <div className="text-right">
          <span className="font-serif italic text-[5.8pt] text-indigo-950 font-bold block leading-none">
            {school?.name ? school.name.split(' ')[0] : 'Principal'}
          </span>
          <span className="text-[4pt] text-slate-500 uppercase tracking-wider font-semibold">
            Principal Sign
          </span>
        </div>
      </div>
    </div>
  );
};

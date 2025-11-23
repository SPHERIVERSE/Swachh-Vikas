'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/axiosInstance';
import { Role } from '@prisma/client';
import { IoSchoolOutline, IoRibbonOutline, IoFolderOutline } from 'react-icons/io5';
import { TbCertificate } from 'react-icons/tb';

// --- INTERFACE DEFINITION (based on the snippet) ---
interface Module {
    id: string;
    title: string;
    userProgress: Array<{
      completed: boolean;
      xpEarned: number;
    }>;
}

interface Course {
  id: string;
  title: string;
  description: string;
  isMandatory: boolean;
  role: Role;
  modules: Module[];
  isCompleted: boolean;
  completionDate?: string;
  certificateUrl?: string;
}

// --- HELPER COMPONENTS ---

// A functional component to render a single course card
const CourseCard: React.FC<{ course: Course, onStart: (id: string) => void, onDownload: (url: string) => void }> = ({ course, onStart, onDownload }) => {
    
    // Calculate progress based on whether all modules have progress records
    const totalModules = course.modules.length;
    const completedModules = course.modules.filter(m => 
        m.userProgress.some(p => p.completed)
    ).length;

    const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;
    
    // Determine button text and color
    const buttonText = course.isCompleted ? 'View Course' : (progressPercent > 0 ? 'Continue' : 'Start Course');
    const buttonColor = course.isCompleted ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-600 hover:bg-blue-700';

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-xl flex flex-col justify-between transition-transform hover:scale-[1.01]">
            <div>
                <h3 className="text-xl font-bold text-white mb-2">{course.title}</h3>
                <p className="text-gray-400 mb-4 line-clamp-3">{course.description}</p>
                
                {/* Progress Bar */}
                <div className="mb-4">
                    <p className="text-sm font-medium text-gray-300">Progress: {progressPercent}%</p>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mt-1">
                        <div 
                            className={`h-2.5 rounded-full ${course.isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
                            style={{ width: `${progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4">
                <button
                    onClick={() => onStart(course.id)}
                    className={`flex-1 ${buttonColor} text-white py-2 px-4 rounded-lg font-semibold transition-colors`}
                >
                    {buttonText}
                </button>
                
                {course.isCompleted && course.certificateUrl && (
                    <button
                        onClick={() => onDownload(course.certificateUrl!)}
                        className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg font-semibold flex items-center justify-center transition-colors"
                        title="Download Certificate"
                    >
                        <TbCertificate className="w-5 h-5 mr-1" />
                        Cert
                    </button>
                )}
            </div>
        </div>
    );
};


// --- MAIN COMPONENT ---
export default function CitizenCoursesPage() {
  const router = useRouter();
  const [mandatoryCourses, setMandatoryCourses] = useState<Course[]>([]);
  const [miscellaneousCourses, setMiscellaneousCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'mandatory' | 'miscellaneous' | 'certificates'>('mandatory');

  const fetchCourses = async () => {
    setLoading(true);
    
    // ✅ FIX: Critical token check and redirection
    const token = localStorage.getItem('access_token');
    if (!token) {
        console.error('Authentication token not found. Redirecting to login.');
        router.push('/login'); 
        setLoading(false);
        return; 
    }

    const authHeader = {
      headers: { Authorization: `Bearer ${token}` },
    };

    try {
      // NOTE: Assuming your API returns mandatory and miscellaneous courses separately, 
      // with progress data nested within
      const [mandatoryRes, miscellaneousRes] = await Promise.all([
        api.get('/courses/mandatory', authHeader),
        api.get('/courses/miscellaneous', authHeader),
      ]);

      setMandatoryCourses(mandatoryRes.data);
      setMiscellaneousCourses(miscellaneousRes.data);
      
    } catch (error) {
      console.error('Error fetching courses:', error);
      // In a real app, you would show a toast/alert here
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartCourse = (courseId: string) => {
      // Navigate to the course module view
      router.push(`/auth/dashboard/citizen/courses/${courseId}`);
  };

  const handleDownloadCertificate = (url: string) => {
    if (url) {
      // Open the certificate URL in a new tab
      window.open(url, '_blank');
    }
  };
  
  // Courses that are completed and have a certificate URL
  const completedCourses = [...mandatoryCourses, ...miscellaneousCourses].filter(
      c => c.isCompleted && c.certificateUrl
  );

  const getActiveCourses = () => {
    switch (activeTab) {
      case 'mandatory':
        return mandatoryCourses;
      case 'miscellaneous':
        return miscellaneousCourses;
      case 'certificates':
        return completedCourses;
      default:
        return [];
    }
  };
  
  const activeCourses = getActiveCourses();

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center py-16">
          <div className="w-8 h-8 border-4 border-t-4 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
          <p className="ml-4 text-gray-400">Loading courses...</p>
        </div>
      );
    }

    if (activeCourses.length === 0) {
      const message = activeTab === 'certificates' 
        ? "You haven't earned any certificates yet. Complete a course to see it here."
        : `No ${activeTab} courses available at this time. Check back later!`;

      return (
        <div className="text-center text-gray-400 py-16 bg-gray-800 rounded-lg">
          <IoFolderOutline className="w-12 h-12 mx-auto mb-4 text-gray-500" />
          <p className="text-lg">{message}</p>
        </div>
      );
    }
    
    // Render the list of courses/certificates
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeCourses.map((course) => (
          <CourseCard 
            key={course.id} 
            course={course} 
            onStart={handleStartCourse} 
            onDownload={handleDownloadCertificate} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-white mb-6">Citizen Training & Education</h1>
      <p className="text-gray-400 mb-8">Improve your civic knowledge and earn rewards by completing courses.</p>

      {/* Tab Navigation */}
      <div className="flex space-x-2 md:space-x-4 border-b border-gray-700 mb-8">
        <button
          onClick={() => setActiveTab('mandatory')}
          className={`flex items-center px-4 py-2 text-sm md:text-base font-medium transition-colors ${
            activeTab === 'mandatory'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <IoSchoolOutline className="w-5 h-5 mr-2" />
          Mandatory
        </button>
        <button
          onClick={() => setActiveTab('miscellaneous')}
          className={`flex items-center px-4 py-2 text-sm md:text-base font-medium transition-colors ${
            activeTab === 'miscellaneous'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <IoRibbonOutline className="w-5 h-5 mr-2" />
          Miscellaneous
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`flex items-center px-4 py-2 text-sm md:text-base font-medium transition-colors ${
            activeTab === 'certificates'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TbCertificate className="w-5 h-5 mr-2" />
          Certificates ({completedCourses.length})
        </button>
      </div>

      {/* Content Area */}
      {renderContent()}
    </div>
  );
}

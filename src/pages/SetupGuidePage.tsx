import { AlertCircle, CheckCircle, Code, Database, Key } from 'lucide-react';

export function SetupGuidePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">CampusIQ</h1>
          <p className="mt-2 text-gray-600">Setup Required</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <div className="flex items-start gap-3 mb-6">
            <AlertCircle className="h-6 w-6 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Backend Not Configured</h2>
              <p className="text-sm text-gray-600 mt-1">
                CampusIQ requires a Supabase backend to function. The application is running in 
                configuration mode. Follow the steps below to connect your backend.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="border-l-2 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Step 1: Create a Supabase Project</h3>
              </div>
              <p className="text-sm text-gray-600">
                Go to <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">supabase.com</a> and create a new project. 
                Note your project URL and anon/public key.
              </p>
            </div>

            <div className="border-l-2 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Code className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Step 2: Run Database Migrations</h3>
              </div>
              <p className="text-sm text-gray-600">
                Execute the SQL migrations from <code className="bg-gray-100 px-1 rounded">supabase/migrations/</code> in your Supabase SQL Editor 
                or use the Supabase CLI to apply them.
              </p>
            </div>

            <div className="border-l-2 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold">Step 3: Configure Environment Variables</h3>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Create a <code className="bg-gray-100 px-1 rounded">.env.local</code> file in the project root:
              </p>
              <pre className="bg-gray-900 text-green-400 p-4 rounded text-xs overflow-x-auto">
{`VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=CampusIQ`}
              </pre>
            </div>

            <div className="border-l-2 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Step 4: Enable Authentication</h3>
              </div>
              <p className="text-sm text-gray-600">
                In your Supabase dashboard, go to Authentication → Providers and enable Email auth. 
                Configure email templates if needed.
              </p>
            </div>

            <div className="border-l-2 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <h3 className="font-semibold">Step 5: Set Up Storage</h3>
              </div>
              <p className="text-sm text-gray-600">
                Create storage buckets: <code className="bg-gray-100 px-1 rounded">resources</code>, <code className="bg-gray-100 px-1 rounded">avatars</code>, 
                <code className="bg-gray-100 px-1 rounded">item-images</code>, <code className="bg-gray-100 px-1 rounded">listings</code>, 
                <code className="bg-gray-100 px-1 rounded">ticket-attachments</code>.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">What's Ready</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>✓ Complete frontend application with all modules</li>
              <li>✓ Authentication flows (login, register, password reset)</li>
              <li>✓ Role-based access control architecture</li>
              <li>✓ Real-time messaging infrastructure</li>
              <li>✓ Database migration files for full schema</li>
              <li>✓ Form validation with Zod schemas</li>
              <li>✓ AI assistant interface (requires provider configuration)</li>
              <li>✓ File upload handling for resources and attachments</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Architecture Notes</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Backend: Supabase (PostgreSQL, Auth, Realtime, Storage, RLS)</li>
              <li>• Frontend: React + TypeScript + Vite + Tailwind CSS</li>
              <li>• State: TanStack Query for server state, React Context for auth</li>
              <li>• Forms: React Hook Form + Zod validation</li>
              <li>• Routing: React Router v6 with protected routes</li>
              <li>• Multi-tenant: College-scoped data with RLS policies</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

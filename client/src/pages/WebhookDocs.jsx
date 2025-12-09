import { BookOpen, Copy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import Button from '../components/ui/Button';

const WebhookDocs = () => {
  const [copiedId, setCopiedId] = useState(null);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const CodeBlock = ({ children, id, language = 'json' }) => (
    <div className="relative group">
      <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
        <code>{children}</code>
      </pre>
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(children, id)}
        title="Copy code"
      >
        {copiedId === id ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </Button>
    </div>
  );

  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/api/webhook`
    : 'https://your-domain.com/api/webhook';

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Webhook API Documentation</h1>
        </div>

        <div className="space-y-6">
          {/* Introduction */}
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                The LogWise Webhook API allows external applications to send error logs for AI-powered analysis, 
                automatic logging, and Telegram notifications. This API is designed to be non-blocking and efficient 
                for production use.
              </p>
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Base URL:</strong> <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">{baseUrl}</code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* POST /log Endpoint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-sm font-mono">
                  POST
                </span>
                <span>/log</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground text-sm">
                  Non-blocking webhook endpoint for error logging. Accepts error logs, processes them asynchronously 
                  using AI analysis, saves them to the database, and sends Telegram notifications. Returns immediately 
                  with a 202 Accepted status.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-muted-foreground text-sm">No authentication required (public endpoint)</p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Body</h3>
                <p className="text-muted-foreground text-sm mb-2">Required fields:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">project_id</code> (string, required) - The ID of the project</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">error_text</code> (string, required) - The error message or log text</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">function_name</code> (string, optional) - The name of the function where the error occurred</li>
                </ul>
                <CodeBlock id="log-request">
{`{
  "project_id": "507f1f77bcf86cd799439011",
  "function_name": "processPayment",
  "error_text": "TypeError: Cannot read property 'amount' of undefined\\n    at processPayment (payment.js:45)\\n    at handleCheckout (checkout.js:23)"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <p className="text-muted-foreground text-sm mb-2">Status Code: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">202 Accepted</code></p>
                <CodeBlock id="log-response">
{`{
  "message": "Log registered",
  "project_id": "507f1f77bcf86cd799439011",
  "timestamp": "2024-01-15T10:30:00.000Z"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Error Responses</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">400 Bad Request - Missing required field</p>
                    <CodeBlock id="log-error-400">
{`{
  "error": "error_text is required"
}`}
                    </CodeBlock>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">404 Not Found - Project doesn't exist</p>
                    <CodeBlock id="log-error-404">
{`{
  "error": "Project not found"
}`}
                    </CodeBlock>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">500 Internal Server Error</p>
                    <CodeBlock id="log-error-500">
{`{
  "error": "Failed to register log"
}`}
                    </CodeBlock>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">What Happens After Submission?</h3>
                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
                  <li>API responds immediately with 202 Accepted</li>
                  <li>Error text is analyzed using AI (Groq) to extract summary, cause, severity, and fix suggestions</li>
                  <li>Log entry is saved to the database with all analysis results</li>
                  <li>Telegram notification is sent (if configured) with comprehensive error details</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example cURL Request</h3>
                <CodeBlock id="log-curl" language="bash">
{`curl -X POST ${baseUrl}/log \\
  -H "Content-Type: application/json" \\
  -d '{
    "project_id": "507f1f77bcf86cd799439011",
    "function_name": "processPayment",
    "error_text": "TypeError: Cannot read property 'amount' of undefined"
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* POST /analyze Endpoint */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded text-sm font-mono">
                  POST
                </span>
                <span>/analyze</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground text-sm">
                  Synchronous endpoint for error analysis. Performs AI analysis on error text, saves the log to the database, 
                  and returns the analysis results directly. Does not send Telegram notifications. Designed for frontend UI 
                  integration where users want immediate feedback.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Authentication</h3>
                <p className="text-muted-foreground text-sm mb-2">
                  <strong>Required:</strong> Bearer token authentication. Include the JWT token in the Authorization header.
                </p>
                <CodeBlock id="analyze-auth">
{`Authorization: Bearer <your_jwt_token>`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Request Body</h3>
                <p className="text-muted-foreground text-sm mb-2">Required fields:</p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-3">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">project_id</code> (string, required) - The ID of the project (user must have access)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">error_text</code> (string, required) - The error message or log text</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">function_name</code> (string, optional) - The name of the function where the error occurred</li>
                </ul>
                <CodeBlock id="analyze-request">
{`{
  "project_id": "507f1f77bcf86cd799439011",
  "function_name": "processPayment",
  "error_text": "TypeError: Cannot read property 'amount' of undefined\\n    at processPayment (payment.js:45)\\n    at handleCheckout (checkout.js:23)"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response</h3>
                <p className="text-muted-foreground text-sm mb-2">Status Code: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">200 OK</code></p>
                <CodeBlock id="analyze-response">
{`{
  "log": {
    "id": "507f1f77bcf86cd799439012",
    "summary": "TypeError occurred when trying to access 'amount' property on undefined object",
    "cause": "The payment object is undefined, likely due to missing validation or incorrect data structure",
    "severity": "critical",
    "fix": "Add null/undefined check before accessing payment.amount. Validate payment object exists before processing.",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "project_name": "My Project"
}`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Response Fields</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">log.id</code> - The ID of the created log entry</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">log.summary</code> - AI-generated summary of the error</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">log.cause</code> - AI-identified root cause</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">log.severity</code> - Error severity level (critical, warning, info)</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">log.fix</code> - AI-suggested fix</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">log.createdAt</code> - Timestamp of log creation</li>
                  <li><code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">project_name</code> - Name of the project</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Error Responses</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">400 Bad Request - Missing required field</p>
                    <CodeBlock id="analyze-error-400">
{`{
  "error": "error_text is required"
}`}
                    </CodeBlock>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">401 Unauthorized - Missing or invalid token</p>
                    <CodeBlock id="analyze-error-401">
{`{
  "error": "Unauthorized"
}`}
                    </CodeBlock>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">403 Forbidden - No access to project</p>
                    <CodeBlock id="analyze-error-403">
{`{
  "error": "Access denied to this project"
}`}
                    </CodeBlock>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">404 Not Found - Project doesn't exist</p>
                    <CodeBlock id="analyze-error-404">
{`{
  "error": "Project not found"
}`}
                    </CodeBlock>
                  </div>
                  <div>
                    <p className="text-sm font-medium mb-1">500 Internal Server Error</p>
                    <CodeBlock id="analyze-error-500">
{`{
  "error": "Failed to analyze error"
}`}
                    </CodeBlock>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Example cURL Request</h3>
                <CodeBlock id="analyze-curl" language="bash">
{`curl -X POST ${baseUrl}/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <your_jwt_token>" \\
  -d '{
    "project_id": "507f1f77bcf86cd799439011",
    "function_name": "processPayment",
    "error_text": "TypeError: Cannot read property 'amount' of undefined"
  }'`}
                </CodeBlock>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Feature</th>
                      <th className="text-left p-2">POST /log</th>
                      <th className="text-left p-2">POST /analyze</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Authentication</td>
                      <td className="p-2 text-muted-foreground">Not required</td>
                      <td className="p-2 text-muted-foreground">Required (Bearer token)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Response Type</td>
                      <td className="p-2 text-muted-foreground">Non-blocking (202 Accepted)</td>
                      <td className="p-2 text-muted-foreground">Synchronous (200 OK)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Response Data</td>
                      <td className="p-2 text-muted-foreground">Confirmation only</td>
                      <td className="p-2 text-muted-foreground">Full analysis results</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Telegram Notification</td>
                      <td className="p-2 text-muted-foreground">Yes (if configured)</td>
                      <td className="p-2 text-muted-foreground">No</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Use Case</td>
                      <td className="p-2 text-muted-foreground">Production error logging</td>
                      <td className="p-2 text-muted-foreground">Frontend UI analysis</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Important Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <ul className="list-disc list-inside space-y-1">
                <li>The <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">/log</code> endpoint is designed for high-throughput scenarios where you don't need immediate feedback</li>
                <li>The <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">/analyze</code> endpoint requires the user to have access to the specified project (owner or assigned user)</li>
                <li>Both endpoints save logs to the database, which can be viewed in the Logs page</li>
                <li>AI analysis may take a few seconds, so the <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">/analyze</code> endpoint will wait for completion</li>
                <li>Error text longer than 500 characters will be truncated in Telegram notifications</li>
                <li>Severity levels are automatically determined by AI: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">critical</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">warning</code>, or <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">info</code></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default WebhookDocs;


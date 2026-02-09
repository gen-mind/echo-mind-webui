<script lang="ts">
	import { WEBUI_NAME } from '$lib/stores';
</script>

<svelte:head>
	<title>Privacy Policy • {$WEBUI_NAME}</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-12">
	<h1 class="text-3xl font-bold mb-2 dark:text-white">Privacy Policy</h1>
	<p class="text-sm text-gray-600 dark:text-gray-400 mb-8">Last Updated: February 9, 2026</p>

	<div class="max-w-none">
		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">1. Introduction</h2>
		<p class="mb-4 text-gray-700 dark:text-gray-300">
			EchoMind ("we," "our," or "us") respects your privacy and is committed to protecting your
			personal data. This privacy policy explains how we collect, use, and safeguard your
			information when you use our AI-powered knowledge management and search platform.
		</p>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">2. Information We Collect</h2>

		<h3 class="text-xl font-semibold mt-6 mb-3 dark:text-white">2.1 Information You Provide</h3>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2"><strong>Account Information:</strong> Email address, name, and authentication credentials</li>
			<li>
				<strong>User Content:</strong> Documents, files, and data you upload or connect through integrations
			</li>
			<li><strong>Usage Data:</strong> Search queries, interactions with the platform, and preferences</li>
		</ul>

		<h3 class="text-xl font-semibold mt-6 mb-3 dark:text-white">2.2 Information from Third-Party Services</h3>
		<p class="mb-4 text-gray-700 dark:text-gray-300">
When you connect external services (Google Drive, Gmail, Calendar, Contacts, Microsoft
			Teams, OneDrive), we collect:
		</p>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">Files and documents from connected services</li>
			<li>Email messages and attachments</li>
			<li>Calendar events and meeting information</li>
			<li>Contact information</li>
			<li>OAuth tokens to access these services on your behalf</li>
		</ul>

		<h3 class="text-xl font-semibold mt-6 mb-3 dark:text-white">2.3 Automatically Collected Information</h3>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">IP address and browser information</li>
			<li>Device type and operating system</li>
			<li>Usage patterns and analytics</li>
			<li>Log files and error reports</li>
		</ul>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">3. How We Use Your Information</h2>
		<p>We use your information to:</p>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">Provide and improve our AI-powered search and knowledge management services</li>
			<li>Process and index your content for semantic search</li>
			<li>Generate AI responses and summaries based on your data</li>
			<li>Authenticate and authorize access to your account</li>
			<li>Send service-related notifications</li>
			<li>Analyze usage patterns to improve our platform</li>
			<li>Comply with legal obligations</li>
		</ul>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">4. Data Storage and Security</h2>

		<h3 class="text-xl font-semibold mt-6 mb-3 dark:text-white">4.1 Where We Store Data</h3>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2"><strong>PostgreSQL Database:</strong> User accounts, credentials, connector configurations</li>
			<li><strong>Qdrant Vector Database:</strong> Indexed content and embeddings for semantic search</li>
			<li>
				<strong>MinIO Object Storage:</strong> Original files and documents (encrypted at rest)
			</li>
			<li><strong>OAuth Tokens:</strong> Encrypted in PostgreSQL database</li>
		</ul>

		<h3 class="text-xl font-semibold mt-6 mb-3 dark:text-white">4.2 Security Measures</h3>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">Industry-standard encryption for data in transit (TLS/HTTPS)</li>
			<li>Encryption at rest for sensitive data</li>
			<li>Regular security audits and updates</li>
			<li>Access controls and authentication mechanisms</li>
			<li>Isolated tenant data (multi-tenant architecture)</li>
		</ul>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">5. Data Sharing and Third Parties</h2>
		<p>We do not sell your personal data. We may share your information with:</p>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">
				<strong>Third-Party Services You Connect:</strong> We access Google, Microsoft, and other services
				using OAuth tokens you authorize
			</li>
			<li>
				<strong>AI Model Providers:</strong> Your queries and content may be processed by AI models (OpenAI,
				Anthropic, or self-hosted models depending on your deployment)
			</li>
			<li>
				<strong>Service Providers:</strong> Cloud infrastructure providers hosting your EchoMind instance
			</li>
			<li>
				<strong>Legal Requirements:</strong> When required by law, regulation, or legal process
			</li>
		</ul>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">6. Your Rights and Choices</h2>
		<p>You have the right to:</p>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2"><strong>Access:</strong> Request a copy of your personal data</li>
			<li><strong>Correction:</strong> Update or correct inaccurate information</li>
			<li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
			<li>
				<strong>Revoke Access:</strong> Disconnect third-party integrations at any time through settings
			</li>
			<li><strong>Data Portability:</strong> Export your data in a machine-readable format</li>
			<li><strong>Opt-Out:</strong> Disable certain data collection features</li>
		</ul>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">7. Data Retention</h2>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">
				<strong>Active Accounts:</strong> Data retained while your account is active
			</li>
			<li>
				<strong>Deleted Accounts:</strong> Data deleted within 30 days of account deletion (backups may
				persist for up to 90 days)
			</li>
			<li>
				<strong>Legal Obligations:</strong> Some data may be retained longer if required by law
			</li>
		</ul>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">8. Children's Privacy</h2>
		<p class="mb-4 text-gray-700 dark:text-gray-300">
EchoMind is not intended for users under 13 years of age. We do not knowingly collect
			personal information from children. If you believe we have collected data from a child,
			please contact us immediately.
		</p>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">9. International Data Transfers</h2>
		<p class="mb-4 text-gray-700 dark:text-gray-300">
Your data may be processed in countries other than your own. We ensure appropriate
			safeguards are in place to protect your data in accordance with this privacy policy.
		</p>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">10. Cookies and Tracking</h2>
		<p>We use cookies and similar technologies to:</p>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">Maintain your login session</li>
			<li>Remember your preferences</li>
			<li>Analyze platform usage</li>
			<li>Improve user experience</li>
		</ul>
		<p>You can control cookies through your browser settings.</p>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">11. Changes to This Policy</h2>
		<p class="mb-4 text-gray-700 dark:text-gray-300">
We may update this privacy policy from time to time. We will notify you of significant
			changes by email or through the platform. Continued use after changes constitutes acceptance
			of the updated policy.
		</p>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">12. Contact Us</h2>
		<p>For privacy-related questions or requests, contact us at:</p>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2"><strong>Email:</strong> privacy@echomind.ch</li>
			<li><strong>Support:</strong> Through the in-app support system</li>
		</ul>

		<h2 class="text-2xl font-bold mt-8 mb-4 dark:text-white">13. Third-Party Services and OAuth</h2>
		<p>When you connect third-party services:</p>
		<ul class="list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300">
			<li class="mb-2">
				<strong>Google Services:</strong> Subject to
				<a
					href="https://policies.google.com/privacy"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:underline">Google's Privacy Policy</a
				>
			</li>
			<li>
				<strong>Microsoft Services:</strong> Subject to
				<a
					href="https://privacy.microsoft.com/privacystatement"
					target="_blank"
					rel="noopener noreferrer"
					class="text-blue-600 hover:underline">Microsoft's Privacy Statement</a
				>
			</li>
		</ul>
		<p class="mb-4 text-gray-700 dark:text-gray-300">
We only request the minimum necessary permissions to provide our services. You can revoke
			access at any time through your account settings or the third-party service's permission
			management.
		</p>

		<hr class="my-8 border-gray-300 dark:border-gray-700" />

		<p class="text-sm text-gray-600 dark:text-gray-400">
			This privacy policy is effective as of February 9, 2026, and was last updated on February 9,
			2026.
		</p>
	</div>
</div>

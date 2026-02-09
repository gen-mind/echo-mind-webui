<script lang="ts">
	import { WEBUI_NAME } from '$lib/stores';
</script>

<svelte:head>
	<title>Terms of Service • {$WEBUI_NAME}</title>
</svelte:head>

<div class="max-w-4xl mx-auto px-4 py-12">
	<h1 class="text-3xl font-bold mb-2 dark:text-white">Terms of Service</h1>
	<p class="text-sm text-gray-600 dark:text-gray-400 mb-8">Last Updated: February 9, 2026</p>

	<div class="prose dark:prose-invert max-w-none">
		<h2>1. Acceptance of Terms</h2>
		<p>
			By accessing or using EchoMind (the "Service"), you agree to be bound by these Terms of
			Service ("Terms"). If you do not agree to these Terms, do not use the Service.
		</p>

		<h2>2. Description of Service</h2>
		<p>
			EchoMind is an AI-powered knowledge management and search platform that enables users to:
		</p>
		<ul>
			<li>Connect and index content from various sources (Google Drive, Gmail, etc.)</li>
			<li>Perform semantic search across their connected data</li>
			<li>Interact with AI assistants to query and organize their information</li>
			<li>Manage personal and organizational knowledge bases</li>
		</ul>

		<h2>3. User Accounts</h2>

		<h3>3.1 Account Creation</h3>
		<ul>
			<li>You must be at least 13 years old to create an account</li>
			<li>You must provide accurate and complete information during registration</li>
			<li>You are responsible for maintaining the security of your account credentials</li>
			<li>You are responsible for all activities that occur under your account</li>
		</ul>

		<h3>3.2 Account Responsibilities</h3>
		<ul>
			<li>Notify us immediately of any unauthorized use of your account</li>
			<li>Do not share your account credentials with others</li>
			<li>Do not create multiple accounts for abusive purposes</li>
			<li>Keep your contact information up to date</li>
		</ul>

		<h2>4. Acceptable Use</h2>

		<h3>4.1 Permitted Use</h3>
		<p>You may use the Service for lawful purposes only, including:</p>
		<ul>
			<li>Personal knowledge management and organization</li>
			<li>Business productivity and collaboration</li>
			<li>Research and information retrieval</li>
			<li>Content indexing and search</li>
		</ul>

		<h3>4.2 Prohibited Activities</h3>
		<p>You agree NOT to:</p>
		<ul>
			<li>Violate any applicable laws or regulations</li>
			<li>Infringe upon intellectual property rights of others</li>
			<li>Upload malware, viruses, or harmful code</li>
			<li>Attempt to gain unauthorized access to the Service or other users' data</li>
			<li>Use the Service to spam, phish, or distribute unsolicited communications</li>
			<li>Scrape, mine, or harvest data from the Service without authorization</li>
			<li>Reverse engineer, decompile, or disassemble any part of the Service</li>
			<li>Overload or interfere with the Service's infrastructure</li>
			<li>Impersonate others or misrepresent your affiliation</li>
			<li>Use the Service for illegal surveillance or data collection</li>
		</ul>

		<h2>5. Third-Party Services and Integrations</h2>

		<h3>5.1 Connected Services</h3>
		<p>
			When you connect third-party services (Google Drive, Gmail, Calendar, Contacts, Microsoft
			Teams, OneDrive):
		</p>
		<ul>
			<li>
				You grant EchoMind permission to access your data from those services according to the
				OAuth scopes you authorize
			</li>
			<li>
				You are responsible for complying with the terms of service of those third-party
				providers
			</li>
			<li>You can revoke access at any time through your account settings</li>
			<li>We are not responsible for changes to third-party APIs or service interruptions</li>
		</ul>

		<h3>5.2 Third-Party Links</h3>
		<p>
			The Service may contain links to third-party websites or services. We are not responsible
			for the content, privacy practices, or terms of those external sites.
		</p>

		<h2>6. AI and Machine Learning</h2>

		<h3>6.1 AI-Generated Content</h3>
		<ul>
			<li>
				AI-generated responses are provided for informational purposes and may contain
				inaccuracies
			</li>
			<li>You are responsible for verifying the accuracy of AI-generated information</li>
			<li>Do not rely solely on AI responses for critical decisions</li>
			<li>AI models may be updated or changed without notice</li>
		</ul>

		<h3>6.2 Model Training</h3>
		<ul>
			<li>Your data is NOT used to train third-party AI models (OpenAI, Anthropic, etc.)</li>
			<li>
				We may use anonymized, aggregated data to improve our own services (if applicable to your
				deployment)
			</li>
			<li>Self-hosted deployments have full control over data usage</li>
		</ul>

		<h2>7. Intellectual Property</h2>

		<h3>7.1 Your Content</h3>
		<ul>
			<li>You retain all rights to the content you upload or connect to the Service</li>
			<li>
				You grant EchoMind a limited license to process, store, and display your content to
				provide the Service
			</li>
			<li>You represent that you have the right to upload and share your content</li>
		</ul>

		<h3>7.2 EchoMind's Intellectual Property</h3>
		<ul>
			<li>
				The Service, including its code, design, and documentation, is protected by copyright and
				other intellectual property laws
			</li>
			<li>You may not copy, modify, distribute, or create derivative works without permission</li>
			<li>Open-source components are licensed under their respective licenses</li>
		</ul>

		<h2>8. Fees and Payment</h2>

		<h3>8.1 Pricing</h3>
		<ul>
			<li>Pricing varies by deployment model (self-hosted, cloud-hosted, enterprise)</li>
			<li>We reserve the right to change pricing with 30 days' notice</li>
			<li>Fees are non-refundable except as required by law</li>
		</ul>

		<h3>8.2 Free Trials</h3>
		<ul>
			<li>Free trials may be offered with limited features or duration</li>
			<li>Trial terms will be clearly disclosed at the time of signup</li>
			<li>We may terminate free trials at any time</li>
		</ul>

		<h2>9. Data Retention and Deletion</h2>
		<ul>
			<li>
				<strong>Active Accounts:</strong> Your data is retained while your account is active
			</li>
			<li>
				<strong>Account Deletion:</strong> When you delete your account, your data will be deleted
				within 30 days
			</li>
			<li>
				<strong>Backups:</strong> Backup copies may persist for up to 90 days for disaster recovery
			</li>
			<li>
				<strong>Legal Holds:</strong> Data may be retained longer if required by law or legal
				process
			</li>
		</ul>

		<h2>10. Service Availability</h2>

		<h3>10.1 Uptime</h3>
		<ul>
			<li>We strive to maintain high availability but do not guarantee 100% uptime</li>
			<li>Scheduled maintenance will be announced when possible</li>
			<li>Service Level Agreements (SLAs) may be available for enterprise customers</li>
		</ul>

		<h3>10.2 Service Modifications</h3>
		<ul>
			<li>We may modify, suspend, or discontinue any part of the Service at any time</li>
			<li>We will provide notice of material changes when feasible</li>
			<li>No compensation will be provided for service modifications or interruptions</li>
		</ul>

		<h2>11. Limitation of Liability</h2>
		<p>
			TO THE MAXIMUM EXTENT PERMITTED BY LAW, ECHOMIND AND ITS AFFILIATES SHALL NOT BE LIABLE
			FOR:
		</p>
		<ul>
			<li>Indirect, incidental, special, consequential, or punitive damages</li>
			<li>Loss of profits, revenue, data, or business opportunities</li>
			<li>Service interruptions, errors, or security breaches</li>
			<li>Third-party actions or content</li>
			<li>AI-generated content inaccuracies or errors</li>
		</ul>
		<p>
			Our total liability for any claim arising from these Terms or the Service shall not exceed
			the fees you paid in the 12 months preceding the claim, or $100, whichever is greater.
		</p>

		<h2>12. Indemnification</h2>
		<p>
			You agree to indemnify and hold harmless EchoMind, its affiliates, and their respective
			officers, directors, employees, and agents from any claims, damages, losses, liabilities,
			and expenses (including legal fees) arising from:
		</p>
		<ul>
			<li>Your use of the Service</li>
			<li>Your violation of these Terms</li>
			<li>Your violation of any law or third-party rights</li>
			<li>Content you upload or share through the Service</li>
		</ul>

		<h2>13. Warranty Disclaimer</h2>
		<p>
			THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS
			OR IMPLIED, INCLUDING BUT NOT LIMITED TO:
		</p>
		<ul>
			<li>Warranties of merchantability, fitness for a particular purpose, or non-infringement</li>
			<li>Warranties that the Service will be uninterrupted, secure, or error-free</li>
			<li>Warranties regarding the accuracy or reliability of AI-generated content</li>
		</ul>

		<h2>14. Termination</h2>

		<h3>14.1 Termination by You</h3>
		<ul>
			<li>You may terminate your account at any time through account settings</li>
			<li>Upon termination, your data will be deleted according to our retention policy</li>
		</ul>

		<h3>14.2 Termination by Us</h3>
		<p>We may suspend or terminate your account if:</p>
		<ul>
			<li>You violate these Terms</li>
			<li>Your account is inactive for an extended period</li>
			<li>Required by law or legal process</li>
			<li>Necessary to protect the Service or other users</li>
		</ul>
		<p>We will provide notice when feasible, but may terminate immediately for serious violations.</p>

		<h2>15. Governing Law and Disputes</h2>

		<h3>15.1 Governing Law</h3>
		<p>
			These Terms are governed by the laws of Switzerland, without regard to conflict of law
			principles.
		</p>

		<h3>15.2 Dispute Resolution</h3>
		<ul>
			<li>
				Any disputes arising from these Terms or the Service shall be resolved through negotiation
				or mediation
			</li>
			<li>
				If resolution is not possible, disputes shall be subject to the exclusive jurisdiction of
				the courts in Switzerland
			</li>
		</ul>

		<h2>16. Changes to These Terms</h2>
		<ul>
			<li>We may update these Terms from time to time</li>
			<li>We will notify you of material changes by email or through the Service</li>
			<li>Continued use after changes constitutes acceptance of the updated Terms</li>
			<li>If you do not agree to the updated Terms, you must stop using the Service</li>
		</ul>

		<h2>17. Severability</h2>
		<p>
			If any provision of these Terms is found to be invalid or unenforceable, the remaining
			provisions will continue in full force and effect.
		</p>

		<h2>18. Entire Agreement</h2>
		<p>
			These Terms constitute the entire agreement between you and EchoMind regarding the Service
			and supersede any prior agreements or understandings.
		</p>

		<h2>19. Contact Information</h2>
		<p>For questions or concerns about these Terms, contact us at:</p>
		<ul>
			<li><strong>Email:</strong> legal@echomind.ch</li>
			<li><strong>Support:</strong> Through the in-app support system</li>
		</ul>

		<h2>20. Export Compliance</h2>
		<p>
			You agree to comply with all applicable export and import laws and regulations. You may not
			use the Service in any country subject to trade embargoes or sanctions.
		</p>

		<hr class="my-8" />

		<p class="text-sm text-gray-600 dark:text-gray-400">
			These terms of service are effective as of February 9, 2026, and were last updated on
			February 9, 2026.
		</p>

		<p class="text-sm text-gray-600 dark:text-gray-400 mt-4">
			For information about how we handle your data, please review our
			<a href="/privacy" class="text-blue-600 hover:underline dark:text-blue-400"
				>Privacy Policy</a
			>.
		</p>
	</div>
</div>

<style>
	:global(.prose) {
		max-width: none;
	}

	:global(.prose h2) {
		@apply text-2xl font-bold mt-8 mb-4 dark:text-white;
	}

	:global(.prose h3) {
		@apply text-xl font-semibold mt-6 mb-3 dark:text-white;
	}

	:global(.prose p) {
		@apply mb-4 text-gray-700 dark:text-gray-300;
	}

	:global(.prose ul) {
		@apply list-disc ml-6 mb-4 text-gray-700 dark:text-gray-300;
	}

	:global(.prose li) {
		@apply mb-2;
	}

	:global(.prose a) {
		@apply text-blue-600 hover:underline dark:text-blue-400;
	}

	:global(.prose hr) {
		@apply border-gray-300 dark:border-gray-700;
	}
</style>

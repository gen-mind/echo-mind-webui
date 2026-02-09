<script lang="ts">
	import { WEBUI_NAME } from '$lib/stores';
</script>

<footer class="w-full py-4 px-4 text-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700">
	<div class="flex flex-wrap justify-center gap-4">
		<span>© 2026 {$WEBUI_NAME}</span>
		<a href="/privacy" class="hover:text-gray-700 dark:hover:text-gray-300 underline">
			Privacy Policy
		</a>
		<a href="/terms" class="hover:text-gray-700 dark:hover:text-gray-300 underline">
			Terms of Service
		</a>
	</div>
</footer>

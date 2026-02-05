<script lang="ts">
	import { getContext, createEventDispatcher } from 'svelte';
	import { toast } from 'svelte-sonner';

	import Modal from '$lib/components/common/Modal.svelte';
	import XMark from '$lib/components/icons/XMark.svelte';
	import Spinner from '$lib/components/common/Spinner.svelte';

	import { uploadDocument } from '$lib/apis/echomind';

	const i18n = getContext('i18n');
	const dispatch = createEventDispatcher();

	export let show = false;

	let loading = false;
	let uploadProgress = 0;

	// Form fields
	let files: FileList | null = null;
	let title = '';
	let fileInput: HTMLInputElement;

	function resetForm() {
		files = null;
		title = '';
		uploadProgress = 0;
		if (fileInput) {
			fileInput.value = '';
		}
	}

	function handleFileSelect(event: Event) {
		const input = event.target as HTMLInputElement;
		files = input.files;
		// Auto-set title from first file name if not already set
		if (files && files.length > 0 && !title) {
			title = files[0].name.replace(/\.[^/.]+$/, ''); // Remove extension
		}
	}

	async function handleSubmit() {
		if (!files || files.length === 0) {
			toast.error($i18n.t('Please select a file'));
			return;
		}

		loading = true;
		uploadProgress = 0;

		try {
			const file = files[0];
			const result = await uploadDocument(localStorage.token, file, {
				title: title.trim() || undefined,
				onProgress: (progress) => {
					uploadProgress = progress;
				}
			});
			toast.success($i18n.t('Document uploaded successfully'));
			dispatch('uploaded', result);
			resetForm();
			show = false;
		} catch (error) {
			toast.error(error?.toString() || $i18n.t('Failed to upload document'));
		} finally {
			loading = false;
		}
	}

	function handleClose() {
		resetForm();
		show = false;
	}

	function handleDragOver(event: DragEvent) {
		event.preventDefault();
	}

	function handleDrop(event: DragEvent) {
		event.preventDefault();
		if (event.dataTransfer?.files) {
			files = event.dataTransfer.files;
			if (files.length > 0 && !title) {
				title = files[0].name.replace(/\.[^/.]+$/, '');
			}
		}
	}

	// Supported file types
	const acceptedTypes = [
		'.pdf',
		'.doc',
		'.docx',
		'.txt',
		'.md',
		'.html',
		'.csv',
		'.xls',
		'.xlsx',
		'.ppt',
		'.pptx',
		'.png',
		'.jpg',
		'.jpeg',
		'.gif',
		'.webp',
		'.bmp',
		'.tiff'
	].join(',');
</script>

<Modal size="md" bind:show>
	<div class="p-6">
		<!-- Header -->
		<div class="flex justify-between items-center mb-6">
			<h3 class="text-lg font-medium dark:text-white">{$i18n.t('Upload Document')}</h3>
			<button
				class="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-white"
				on:click={handleClose}
			>
				<XMark className="size-5" />
			</button>
		</div>

		<!-- Form -->
		<form on:submit|preventDefault={handleSubmit}>
			<div class="space-y-4">
				<!-- File Drop Zone -->
				<div>
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('File')} <span class="text-red-500">*</span>
					</span>
					<div
						class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition"
						on:dragover={handleDragOver}
						on:drop={handleDrop}
						on:click={() => fileInput.click()}
						role="button"
						tabindex="0"
						on:keydown={(e) => e.key === 'Enter' && fileInput.click()}
					>
						<input
							bind:this={fileInput}
							type="file"
							accept={acceptedTypes}
							on:change={handleFileSelect}
							class="hidden"
						/>
						{#if files && files.length > 0}
							<div class="text-blue-600 dark:text-blue-400">
								<svg
									class="w-12 h-12 mx-auto mb-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p class="font-medium">{files[0].name}</p>
								<p class="text-sm text-gray-500 dark:text-gray-400">
									{(files[0].size / 1024 / 1024).toFixed(2)} MB
								</p>
							</div>
						{:else}
							<svg
								class="w-12 h-12 mx-auto mb-2 text-gray-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
								/>
							</svg>
							<p class="text-gray-600 dark:text-gray-400">
								{$i18n.t('Drag and drop a file here, or click to browse')}
							</p>
							<p class="text-xs text-gray-400 mt-2">
								{$i18n.t('Supported: PDF, Word, Excel, PowerPoint, text files, images')}
							</p>
						{/if}
					</div>
				</div>

				<!-- Title -->
				<label class="block">
					<span class="block text-sm font-medium mb-1 dark:text-gray-200">
						{$i18n.t('Title')}
					</span>
					<input
						type="text"
						bind:value={title}
						placeholder={$i18n.t('Optional - defaults to filename')}
						class="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
					/>
				</label>

				<!-- Upload Progress -->
				{#if loading && uploadProgress > 0}
					<div>
						<div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
							<span>{$i18n.t('Uploading...')}</span>
							<span>{uploadProgress}%</span>
						</div>
						<div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
							<div
								class="bg-blue-600 h-2 rounded-full transition-all duration-300"
								style="width: {uploadProgress}%"
							></div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="flex justify-end gap-2 mt-6">
				<button
					type="button"
					class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
					on:click={handleClose}
				>
					{$i18n.t('Cancel')}
				</button>
				<button
					type="submit"
					class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
					disabled={loading || !files || files.length === 0}
				>
					{#if loading}
						<Spinner class="w-4 h-4" />
					{/if}
					{loading ? $i18n.t('Uploading...') : $i18n.t('Upload')}
				</button>
			</div>
		</form>
	</div>
</Modal>

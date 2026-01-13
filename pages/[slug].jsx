import { useMemo, useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

import Layout from '@components/layout';
import AlertError from '@components/error';
import KeyboardShortcutHelp from '@components/KeyboardShortcutHelp';
import FileHistory from '@components/FileHistory';
import { ConversionLoader, LargeFileIndicator } from '@components/LoadingState';
import { tools } from '@constants/tools';
import { globals } from '@constants/globals';
import { postFileWithProgress } from '@utils/requests';
import { mimeTypes } from '@constants/mimetypes';
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';
import { useFileHistory } from '@hooks/useFileHistory';

const Slug = ({ slug }) => {
  const title = slug?.replace(/-/g, ' ');
  const api = slug?.replace(/-/g, '');
  const fileType = slug?.split('-');
  const [downloadLink, setDownloadLink] = useState('');
  const [downloadFilename, setDownloadFilename] = useState('');
  const [errorMessage, setErrorMessage] = useState('Something went wrong, Please try again.');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [converted, setConverted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStage, setProcessingStage] = useState('');
  const mimeType = (fileType?.length > 0) ? mimeTypes[fileType[0]]: mimeTypes.json;
  const { addToHistory } = useFileHistory();

  // 100MB limit (from globals)
  const maxSize = globals.maxFileSize.free;
  const largeFileThreshold = globals.largeFileWarningThreshold;

  // Reset state when a new file is selected
  const handleFileAccepted = () => {
    if (converted) {
      setDownloadLink('');
      setDownloadFilename('');
      setConverted(false);
      setShowError(false);
      setUploadProgress(0);
      setProcessingStage('');
    }
  };

  const handleSubmit = useCallback(async () => {
    if (acceptedFiles.length) {
      setLoading(true);
      setShowError(false);
      setConverted(false);
      setDownloadLink('');
      setDownloadFilename('');
      setUploadProgress(0);
      setProcessingStage('Uploading file...');

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('fileInfo', file);

      // Determine if we should use progress tracking (for large files)
      const isLargeFile = file.size > largeFileThreshold;

      try {
        const handleProgress = ({ stage, progress, message }) => {
          setUploadProgress(progress);
          if (stage === 'upload') {
            setProcessingStage(`Uploading... ${progress}%`);
          } else if (stage === 'processing') {
            setProcessingStage(message || 'Converting your file...');
          } else if (stage === 'complete') {
            setProcessingStage('Complete!');
          }
        };

        const response = await postFileWithProgress(`api/${api}`, formData, isLargeFile ? handleProgress : null);

        // Check if response indicates an error
        if (!response || response.success === false) {
          const errorMessage = response?.error || response?.message || 'Conversion failed';
          throw new Error(errorMessage);
        }

        // Handle different response structures
        const filePath = response?.data || '';

        if (!filePath || typeof filePath !== 'string') {
          throw new Error('No file path returned from server');
        }

        setDownloadLink(filePath);

        // Generate filename from original filename with timestamp
        const originalName = file.name.split('.')[0];
        const timestamp = new Date().getTime();
        const fileExtension = fileType && fileType.length > 0 ? fileType[fileType.length - 1] : 'json';
        const filename = `${originalName}_${timestamp}.${fileExtension}`;

        setDownloadFilename(filename);
        setConverted(true);
        setLoading(false);
        setShowError(false);
        setProcessingStage('');

        // Add to file history
        addToHistory({
          fileName: file.name,
          fromFormat: fileType[0].toUpperCase(),
          toFormat: fileType[fileType.length - 1].toUpperCase(),
          downloadLink: filePath,
          fileSize: file.size,
        });
      } catch (err) {
        console.error('Conversion Error:', err);
        let errorMsg = err.message || 'Conversion failed. Please try again.';

        // Format error messages based on conversion type
        const errorPrefixes = {
          'jsontocsv': 'JSON to CSV',
          'csvtojson': 'CSV to JSON',
          'jsontoyaml': 'JSON to YAML',
          'yamltojson': 'YAML to JSON',
          'jsontoxml': 'JSON to XML',
          'xmltojson': 'XML to JSON',
          'jsontophp': 'JSON to PHP',
          'phptojson': 'PHP to JSON',
          'jsontomarkdown': 'JSON to Markdown',
          'markdowntojson': 'Markdown to JSON',
          'jsontohtml': 'JSON to HTML',
          'htmltojson': 'HTML to JSON'
        };

        const prefix = errorPrefixes[api] || 'Conversion';
        if (!errorMsg.includes(prefix.split(' ')[0])) {
          errorMsg = `${prefix} conversion failed: ${errorMsg}`;
        }

        setErrorMessage(errorMsg);
        setShowError(true);
        setLoading(false);
        setConverted(false);
        setProcessingStage('');
        setTimeout(() => {
          setShowError(false);
        }, 8000);
      }
    }
  }, [api, fileType, largeFileThreshold, addToHistory]);

  const handleReset = useCallback(() => {
    setDownloadLink('');
    setDownloadFilename('');
    setConverted(false);
    setShowError(false);
    setLoading(false);
    setUploadProgress(0);
    setProcessingStage('');
  }, []);

  const {
    isDragActive,
    getRootProps,
    getInputProps,
    isDragReject,
    isDragAccept,
    acceptedFiles,
    fileRejections
  } = useDropzone({
    maxFiles: 1,
    accept: mimeType,
    minSize: 1,
    maxSize,
    noKeyboard: true,
    onDropAccepted: handleFileAccepted
  });

  // Keyboard shortcuts
  useKeyboardShortcuts({
    'mod+enter': () => {
      if (acceptedFiles.length > 0 && !loading && !converted) {
        handleSubmit();
      }
    },
    'escape': handleReset
  }, { enabled: true });

  const isFileTooLarge = fileRejections?.length > 0 && fileRejections[0]?.file?.size > maxSize;
  const rejectedFileSize = isFileTooLarge ? (fileRejections[0]?.file?.size / 1048576).toFixed(2) : 0;
  const maxSizeMB = (maxSize / 1048576).toFixed(0);

  // Check if selected file is large (for warning)
  const selectedFile = acceptedFiles[0];
  const isLargeFile = selectedFile && selectedFile.size > largeFileThreshold;
  const selectedFileSizeMB = selectedFile ? selectedFile.size / 1048576 : 0;

  const style = useMemo(() => ({
    ...(isDragActive ? { borderColor: '#2196f3' } : {}),
    ...(isDragAccept ? { borderColor: '#00e676' } : {}),
    ...(isDragReject ? { borderColor: '#ff1744' } : {})
  }), [
    isDragActive,
    isDragReject,
    isDragAccept
  ]);

  return (
    <Layout
      title={title}
      description='Make JSON files easy to read by converting them to CSV.'
    >

      <div className="mt-10 w-full">

        <div {...getRootProps({
          className: 'dropzone h-fifty bg-white dark:bg-dark-surface border-2 border-dashed border-gray-300 dark:border-dark-border text-gray-700 dark:text-dark-text hover:border-blue-400 dark:hover:border-blue-500 transition-colors duration-200',
          ...style
        })}>
          <input {...getInputProps()} />
          {/* Display instructions and visual feedback depending on drag/drop state */}
          {!isDragActive && 'Click here or drop a file to upload!'}
          {isDragActive && !isDragReject && "Drop it like it's hot!"}
          {isDragReject && "File type not accepted, sorry!"}

          {/* Show error if file is rejected for being too large */}
          {isFileTooLarge && (
            <div className="text-red-600 dark:text-red-400 mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-md">
              <strong>File too large!</strong> Your file is {rejectedFileSize}MB. Maximum allowed size is {maxSizeMB}MB.
            </div>
          )}

          {/* List accepted files */}
          <ul className="list-group mt-2 list-none text-green-500 dark:text-green-400 font-semibold">
            {acceptedFiles.length > 0 && acceptedFiles.map(acceptedFile => (
              <li className="bg-green" key={acceptedFile.name}>
                {acceptedFile.name}
              </li>
            ))}
          </ul>

          {/* Large file warning */}
          {isLargeFile && !loading && !converted && (
            <LargeFileIndicator sizeMB={selectedFileSizeMB} />
          )}
        </div>
        {/* Row */}
        <AlertError message={errorMessage} showError={showError} />

        {/* Convert Button - Show when file is selected and not converted yet */}
        {acceptedFiles.length > 0 && !loading && !converted && (
          <div className="row sm:flex mt-5">
            <button
              className="bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg mx-auto transition-colors duration-200 inline-flex items-center"
              onClick={handleSubmit}
            >
              <svg className="fill-current w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
              </svg>
              <span>Convert</span>
            </button>
          </div>
        )}

        {/* Loader - Show when converting */}
        {loading && (
          <div className="row sm:flex mt-5">
            <div className="mx-auto text-center w-full max-w-md">
              {isLargeFile ? (
                <ConversionLoader
                  message={processingStage}
                  progress={uploadProgress}
                  stage={processingStage}
                />
              ) : (
                <ConversionLoader message={processingStage || 'Converting your file...'} />
              )}
            </div>
          </div>
        )}

        {/* Download Button - Show only after successful conversion */}
        {converted && downloadLink && !loading && (
          <div className="row sm:flex mt-5">
            <a
              href={downloadLink}
              download={downloadFilename}
              className='mx-auto'
              style={{ textDecoration: 'none' }}
              onClick={() => {
                setTimeout(() => {
                  URL.revokeObjectURL(downloadLink);
                }, 100);
              }}
            >
              <button className='bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg inline-flex items-center transition-colors duration-200'>
                <svg className="fill-current w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                </svg>
                <span>Download Converted File</span>
              </button>
            </a>
          </div>
        )}

        {/* File History */}
        <FileHistory />
      </div>

      {/* Keyboard shortcut help */}
      <KeyboardShortcutHelp />
    </Layout>
  );
}

export default Slug;

export const getStaticPaths = async () => {
  const slugs = tools.map((t) => t.slug);
  const paths = slugs.map((slug) => ({ params: { slug } }));
  return { paths, fallback: false }
}

export const getStaticProps = async ({ params }) => {
  const slug = params.slug;
  return { props: { slug } };
}

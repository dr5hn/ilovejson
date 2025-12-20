import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import Layout from '@components/layout';
import AlertError from '@components/error';
import { tools } from '@constants/tools';
import { postFile } from '@utils/requests';
import { mimeTypes } from '@constants/mimetypes';

// TODO: Convert it in to actual component
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
  const mimeType = (fileType?.length > 0) ? mimeTypes[fileType[0]]: mimeTypes.json;

  const maxSize = 1048576;

  // Reset state when a new file is selected
  const handleFileAccepted = () => {
    if (converted) {
      setDownloadLink('');
      setDownloadFilename('');
      setConverted(false);
      setShowError(false);
    }
  };

  const handleSubmit = async () => {
    if (acceptedFiles.length) {
      setLoading(true);
      setShowError(false);
      setConverted(false);
      setDownloadLink('');
      setDownloadFilename('');

      const file = acceptedFiles[0];
      const formData = new FormData();
      formData.append('fileInfo', file);

      try {
        const response = await postFile(`api/${api}`, formData);
        
        // Check if response indicates an error
        if (!response || response.success === false) {
          const errorMessage = response?.error || response?.message || 'Conversion failed';
          throw new Error(errorMessage);
        }

        // Handle different response structures
        // ReS returns { success: true, message: '...', data: '...' }
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
        setTimeout(() => {
          setShowError(false);
        }, 8000);
      }
    }
  }

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

  const isFileTooLarge = fileRejections?.length > 0 && fileRejections[0].size > maxSize;

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

        <div {...getRootProps({ className: 'dropzone h-fifty', ...style })}>
          <input {...getInputProps()} />
          {!isDragActive && 'Click here or drop a file to upload!'}
          {isDragActive && !isDragReject && "Drop it like it's hot!"}
          {isDragReject && "File type not accepted, sorry!"}
          {isFileTooLarge && (
            <div className="text-danger mt-2">
              File is too large.
            </div>
          )}
          <ul className="list-group mt-2 list-none text-green-400 font-semibold">
            {acceptedFiles.length > 0 && acceptedFiles.map(acceptedFile => (
              <li className="bg-green" key={acceptedFile.name}>
                {acceptedFile.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Row */}
        <AlertError message={errorMessage} showError={showError} />

        {/* Convert Button - Show when file is selected and not converted yet */}
        {acceptedFiles.length > 0 && !loading && !converted && (
          <div className="row sm:flex mt-5">
            <button 
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg mx-auto transition-colors duration-200 inline-flex items-center"
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
            <div className="mx-auto text-center">
              <div className='loader ease-linear rounded-full border-7 border-t-8 border-gray-200 h-10 w-10 mx-auto'></div>
              <p className="mt-2 text-gray-600">Converting your file...</p>
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
              <button className='bg-green-500 hover:bg-green-600 text-white font-semibold py-3 px-6 rounded-lg shadow-lg inline-flex items-center transition-colors duration-200'>
                <svg className="fill-current w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" />
                </svg>
                <span>Download Converted File</span>
              </button>
            </a>
          </div>
        )}
      </div>
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

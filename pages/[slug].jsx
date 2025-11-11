import { useMemo, useState } from 'react';
import { useDropzone } from 'react-dropzone';

import Layout from '@components/layout';
import AlertError from '@components/error';
import { tools } from '@constants/tools';
import { postFile } from '@utils/requests';
import { mimeTypes } from '@constants/mimetypes';
import Link from 'next/link';

// TODO: Convert it in to actual component
const Slug = ({ slug }) => {
  const title = slug?.replace(/-/g, ' ');
  const api = slug?.replace(/-/g, '');
  const fileType = slug?.split('-');
  const [downloadLink, setDownloadLink] = useState('/');
  const [showError, setShowError] = useState(false);
  const [loading, setLoading] = useState(false);
  const mimeType = (fileType?.length > 0) ? mimeTypes[fileType[0]]: mimeTypes.json;

  const maxSize = 1048576;

  const handleSubmit = () => {
    if (acceptedFiles.length) {
      setLoading(true);
      const formData = new FormData();
      formData.append('fileInfo', acceptedFiles[0]);
      postFile(`api/${api}`, formData)
        .then(response => {
          setDownloadLink(`${response.data}`);
          setLoading(false);
          setShowError(false);
        }).catch(err => {
          console.error(err);
          setLoading(false);
          setShowError(true);
          setTimeout(() => {
            setShowError(false);
          }, 5000);
        });
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
    noKeyboard: true
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
        <AlertError message="Something went wrong, Please try again." showError={showError} />

        {/* Row */}
        <div className={!(downloadLink || loading) ? 'row sm:flex mt-5' : 'hidden'}>
          <button className={`bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow mx-auto ${(!acceptedFiles.length) ? 'disabled:opacity-75' : ''} ${(downloadLink) ? 'hidden' : ''}`} onClick={handleSubmit} disabled={!acceptedFiles.length}>
            <span>Convert</span>
          </button>
        </div>

        {/* Loader */}
        <div className={loading ? 'row sm:flex mt-5' : 'hidden'}>
          <div className='loader ease-linear rounded-full border-7 border-t-8 border-gray-200 h-10 w-10 mx-auto'></div>
        </div>

        {/* Row */}
        <div className={downloadLink ? 'row sm:flex mt-5' : 'hidden'}>
          <Link href={downloadLink} className='mx-auto' download>
            <button className='bg-red-400 hover:bg-red-600 text-white font-semibold py-2 px-4 w-100 border border-gray-400 rounded shadow inline-flex'>
              <svg className="fill-current w-4 h-4 mr-2 mt-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" /></svg>
              <span>Download</span>
            </button>
          </Link>
        </div>
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

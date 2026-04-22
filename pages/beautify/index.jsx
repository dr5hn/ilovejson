import { useState, useRef } from 'react'
import Layout from '@components/layout';
import AlertError from '@components/error';
import SourceEditor from '@components/source';
import { trackToolUsed, trackConversionFailed } from '@utils/analytics';

const Beautify = () => {
  const [sourceJSON, setSourceJSON] = useState('');
  const [outputJSON, setOutputJSON] = useState('');
  const [showError, setShowError] = useState(false);
  const [copied, setCopied] = useState(false);
  const textArea = useRef('');

  const handleChange = (event) => {
    setSourceJSON(event.target.value);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const str = sourceJSON;
    try {
      if (JSON.parse(str) && !!str) {
        setOutputJSON(JSON.stringify(JSON.parse(str), undefined, 4));
        setShowError(false);
        trackToolUsed('beautify', str.length, 0);
      }
    } catch (e) {
      trackConversionFailed('beautify', 'invalid_format');
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 5000);
      return false;
    }
  }

  const copyCodeToClipboard = (event) => {
    textArea.current.select();
    document.execCommand("copy");
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  return (
    <Layout
      title='Beautify JSON'
      description='Make JSON Easy to Read.'
    >

      <div className="app mt-5 w-full h-full p-8 font-sans">
        {/* Row */}
        <div className="row sm:flex">
          {/* Col Left */}
          <SourceEditor>
            <textarea className="resize-none border rounded text-grey-darkest flex-1 p-2 m-1 bg-transparent" name="source" value={sourceJSON} onChange={handleChange} />
          </SourceEditor>

          {/* Col Right */}
          <div className="col mt-8 sm:ml-8 sm:mt-0 sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white box-height">
              <div className="box__title bg-grey-lighter px-3 py-2 border-b">
                <h3 className="text-sm text-grey-darker font-medium inline-flex">Output</h3>
                <button className="py-1 px-4 shadow no-underline rounded-sm bg-green-400 text-white font-sans font-semibold text-xs border-green-600 btn-primary hover:text-white hover:bg-green-600 focus:outline-none active:shadow-none float-right" onClick={copyCodeToClipboard} disabled={!outputJSON}>Copy</button>
                <span className={`mr-2 text-xs text-green-400 float-right align-middle ${copied ? 'visible' : 'invisible'}`}>Copied to Clipboard!</span>
              </div>
              <textarea className="resize text-grey-darkest flex-1 p-2 m-1 bg-transparent" name="output" value={outputJSON} ref={textArea} onChange={() => {}} />
            </div>
          </div>
        </div>

        {/* Row */}
        <AlertError message="You've entered invalid JSON." showError={showError} />

        {/* Row */}
        <div className="row sm:flex mt-5">
          <button className={`bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow mx-auto ${(!sourceJSON) ? 'disabled:opacity-75' : ''}`} onClick={handleSubmit} disabled={!sourceJSON}>
            <span>Beautify</span>
          </button>
        </div>

      </div>
    </Layout>
  )
}

export default Beautify

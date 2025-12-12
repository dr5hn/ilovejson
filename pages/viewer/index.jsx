
import dynamic from 'next/dynamic';
import { useState } from 'react';
import Layout from '@components/layout';
import SourceEditor from '@components/source';
import AlertError from '@components/error';

const Viewer = () => {
  // Note : We need to dynamically load this component, issue ref
  // https://github.com/microlinkhq/react-json-view/issues/121#issuecomment-437267883
  const DynamicReactJson = dynamic(import('@microlink/react-json-view'), { ssr: false });

  const [sourceJSON, setSourceJSON] = useState('');
  const [outputJSON, setOutputJSON] = useState('');
  const [showError, setShowError] = useState(false);

  const handleChange = (e) => {
    setSourceJSON(e.target.value);
    try {
      if (JSON.parse(sourceJSON) && !!sourceJSON) {
        setOutputJSON(JSON.parse(sourceJSON));
        setShowError(false);
      }
    } catch (e) {
      setShowError(true);
      setTimeout(() => {
        setShowError(false);
      }, 5000);
      return false
    }
  }


  const updateSource = (evt) => {
    setSourceJSON(JSON.stringify(evt.updated_src, null, 4));
    setOutputJSON(JSON.parse(JSON.stringify(evt.updated_src, null, 4)));
  }

  const style = {
    overflowY: 'scroll',
    height: '50vh'
  }

  return (
    <Layout
      title='JSON Viewer'
      description='Make JSON Easy to Read.'
      >

      <div className="app mt-5 w-full h-full p-8 font-sans">
        {/* Row */}
        <div className="row sm:flex">
          {/* Col Left */}
          <SourceEditor>
            <textarea className="resize-none border rounded text-grey-darkest flex-1 p-2 m-1 bg-transparent" name="source" value={sourceJSON} onChange={handleChange} onKeyUpCapture={handleChange} />
          </SourceEditor>

          {/* Col Right */}
          <div className="col mt-8 sm:ml-8 sm:mt-0 sm:w-1/2">
            <div className="box border rounded flex flex-col shadow bg-white box-height">
              <div className="box__title bg-grey-lighter px-3 py-2 border-b">
                <h3 className="text-sm text-grey-darker font-medium inline-flex">Output</h3>
              </div>
              <DynamicReactJson name='ilovejson' onAdd={updateSource} onEdit={updateSource} onDelete={updateSource} src={outputJSON} theme='shapeshifter:inverted' displayDataTypes style={style}/>
            </div>
          </div>
        </div>

        {/* Row */}
        <AlertError message="You've entered invalid JSON." showError={showError} />
      </div>
    </Layout>
  )
}

export default Viewer;

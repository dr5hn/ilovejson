const AlertError = ({
  message='I ❤️ JSON. But Something went wrong.',
  showError
}) => (
    <div className={`${showError ? 'sm:flex' : 'hidden'} row mt-3`}>
      <div className="col sm:w-1/2 mx-auto">
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded relative break-words" role="alert">
          <span className="block sm:inline whitespace-pre-wrap">{message}</span>
        </div>
      </div>
    </div>
  )

export default AlertError

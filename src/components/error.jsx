const AlertError = ({
  message='I ❤️ JSON. But Something went wrong.',
  showError,
  onDismiss
}) => (
    <div className={`${showError ? 'sm:flex' : 'hidden'} row mt-3`}>
      <div className="col sm:w-1/2 mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative break-words flex items-start gap-2" role="alert">
          <span className="block sm:inline whitespace-pre-wrap flex-1">{message}</span>
          {onDismiss && (
            <button onClick={onDismiss} className="text-red-500 hover:text-red-700 font-bold text-lg leading-none shrink-0" aria-label="Dismiss">
              &times;
            </button>
          )}
        </div>
      </div>
    </div>
  )

export default AlertError

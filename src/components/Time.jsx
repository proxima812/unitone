import { useEffect, useState } from "react"

function Time() {
	const [now, setNow] = useState(new Date())

	useEffect(() => {
		const interval = setInterval(() => {
			setNow(new Date())
		}, 1000)

		return () => clearInterval(interval)
	}, [])

	const formatTime = date =>
		date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })

	const formatDate = date =>
		date.toLocaleDateString([], {
			year: "numeric",
			month: "long",
			day: "numeric",
		})

	const formatWeekday = date => date.toLocaleDateString([], { weekday: "long" })

	return (
		<div className="text-lg flex  p-3 bg-white shadow-md mb-1 rounded-xl max-w-fit mx-auto gap-3 items-center">
			<span className="font-bold">{formatTime(now)}</span>
			<span className="font-medium">{formatWeekday(now)}</span>
			<span className="text-zinc-600">{formatDate(now)}</span>
		</div>
	)
}

export default Time

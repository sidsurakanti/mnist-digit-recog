"use client";

import { useRef, useState, useEffect } from "react";

export default function DrawCanvas({
	onFinish,
}: {
	onFinish: (data: number[][]) => void;
}) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const [drawing, setDrawing] = useState(false);
	const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
	const [image, setImage] = useState<number[][]>([[]]);

	useEffect(() => {
		const canvas = canvasRef.current!;
		const ctx = canvas.getContext("2d");

		if (ctx) {
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.lineWidth = 12.5;
			ctx.lineCap = "round";
			ctx.lineJoin = "round";
			ctx.strokeStyle = "white";
		}
	}, []);

	const getPos = (e: React.MouseEvent) => {
		const rect = canvasRef.current!.getBoundingClientRect();
		return {
			x: e.clientX - rect.left,
			y: e.clientY - rect.top,
		};
	};

	const startDraw = (e: React.MouseEvent) => {
		setDrawing(true);
		const { x, y } = getPos(e);
		setLastPos({ x, y });
	};

	const stopDraw = () => {
		setDrawing(false);
		setLastPos(null);

		// downscale for model eval
		const smallCanvas = document.createElement("canvas");
		smallCanvas.width = 28;
		smallCanvas.height = 28;

		const ctx = smallCanvas.getContext("2d")!;
		ctx.drawImage(canvasRef.current!, 0, 0, 28, 28);

		const imageData = ctx.getImageData(0, 0, 28, 28);
		const pixels = imageData.data;

		const grayscale: number[][] = [];
		for (let i = 0; i < 28; i++) {
			grayscale.push([]);
			for (let j = 0; j < 28; j++) {
				const index = (i * 28 + j) * 4;
				const r = pixels[index]; // grayscale so we can just use red
				const val = r / 255;
				grayscale[i].push(val);
			}
		}

		setImage(grayscale);
	};

	const draw = (e: React.MouseEvent) => {
		if (!drawing || !canvasRef.current) return;

		const ctx = canvasRef.current.getContext("2d")!;
		const { x, y } = getPos(e);

		if (lastPos) {
			ctx.beginPath();
			ctx.moveTo(lastPos.x, lastPos.y);
			ctx.quadraticCurveTo(lastPos.x, lastPos.y, x, y);
			ctx.stroke();
		}

		setLastPos({ x, y });
	};

	const clearCanvas = () => {
		const canvas = canvasRef.current;
		const ctx = canvas?.getContext("2d");

		if (ctx) {
			ctx.fillStyle = "black";
			ctx.fillRect(0, 0, canvas!.width, canvas!.height);
		}
	};

	return (
		<section className="flex flex-col gap-2">
			<div>
				<canvas
					ref={canvasRef}
					width={280}
					height={280}
					onMouseDown={startDraw}
					onMouseMove={draw}
					onMouseUp={stopDraw}
					onMouseLeave={stopDraw}
					className="shadow-md rounded-2xl border border-black bg-black"
				/>
			</div>

			<div className="pt-2 flex justify-end gap-2">
				<button
					onClick={clearCanvas}
					className="cursor-pointer bg-gradient-to-tr from-stone-100 to-stone-200 hover:from-red-200 hover:to-red-300 text-black border border-neutral-300 hover:border-red-300 shadow-md rounded-full px-4 py-1 text-lg transition-colors"
				>
					clear
				</button>

				<button
					onClick={() => onFinish(image)}
					className="cursor-pointer bg-gradient-to-tr from-stone-100 to-stone-200 hover:from-blue-200 hover:to-blue-300 text-black border border-neutral-300 hover:border-blue-300  shadow-md rounded-full px-4 py-1 text-lg transition-colors"
				>
					guess
				</button>
			</div>
		</section>
	);
}

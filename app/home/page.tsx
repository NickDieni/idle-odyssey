export default function Home() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-sky-200 to-green-100">
            <div className="relative">
                {/* Tree crown */}
                <div className="w-0 h-0 border-l-[100px] border-l-transparent border-r-[100px] border-r-transparent border-b-[120px] border-b-green-600 mx-auto"></div>
                <div className="w-0 h-0 border-l-[90px] border-l-transparent border-r-[90px] border-r-transparent border-b-[110px] border-b-green-500 mx-auto -mt-16"></div>
                <div className="w-0 h-0 border-l-[80px] border-l-transparent border-r-[80px] border-r-transparent border-b-[100px] border-b-green-400 mx-auto -mt-14"></div>
                
                {/* Tree trunk */}
                <div className="w-12 h-24 bg-amber-800 mx-auto"></div>
            </div>
        </div>
    );
}
"use client";
import { useState } from "react";
import Link from "next/link";

export default function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* 상단 네비게이션 바 */}
      <nav className="fixed top-0 left-0 w-full bg-white text-blue-500 p-4 z-[50] flex justify-between items-center">
        {/* 햄버거 버튼 */}
        <button
          className="text-white px-2 py-1 focus:outline-none"
          onClick={() => setIsOpen(true)}
        >
          <img src="/menu.png" alt="Menu" className="w-8 h-8" />
        </button>
        <div className="flex gap-4 px-4">
          <Link href="/" className="hover:text-gray-300">Google Login</Link>
        </div>
      </nav>

      {/* 사이드 메뉴 (왼쪽에서 슬라이드) */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-white text-black p-6 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out shadow-lg z-[60]`}
      >
        {/* 닫기 버튼 */}
        <button
          className="absolute top-4 right-4 text-black"
          onClick={() => setIsOpen(false)}
        >
          <img src="/close.png" alt="Close" className="w-6 h-6" />
        </button>

        {/* 네비게이션 메뉴 */}
        <ul className="mt-10 space-y-4">
            <h2 className="text-lg font-bold text-gray-700 mb-4">Service</h2>
          <li className="flex items-center gap-2">
            <img src="/today.png" className="w-[30px] h-[30px]"/>
            <Link href="/" className="hover:text-gray-300" onClick={() => setIsOpen(false)}>
              Calendar
            </Link>
          </li>
          <li className="flex items-center gap-2">
           <img src="/mail.png" className="w-[30px] h-[30px]"/>
            <Link href="/" className="hover:text-gray-300" onClick={() => setIsOpen(false)}>
              Mail
            </Link>
          </li>
          <li className="flex items-center gap-2">
            <img src="/folder.png" className="w-[30px] h-[30px]"/>
            <Link href="/" className="hover:text-gray-300" onClick={() => setIsOpen(false)}>
              Drive
            </Link>
          </li>
        </ul>
      </div>

      {/* 배경 오버레이 (사이드바 열릴 때만 표시) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[55]"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}

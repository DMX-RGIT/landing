"use client";
import { HomeIcon, BookOpenIcon, BriefcaseIcon } from "lucide-react";
import { useState } from "react";
import Header from "./ui/header";

export const NavBar = () => {
  const [index, setIndex] = useState(0);

  const headers = [
    {
      title: "Home",
      icon: <HomeIcon className="h-6 w-6" />,
      onClick: (index: number) => setIndex(index),
    },
    {
      title: "Blogs",
      icon: <BookOpenIcon className="h-6 w-6" />,
      onClick: (index: number) => setIndex(index),
    },
    {
      title: "Works",
      icon: <BriefcaseIcon className="h-6 w-6" />,
      onClick: (index: number) => setIndex(index),
    },
  ];
  return (
    <div className="w-full flex justify-center absolute z-10 top-10">
      <Header links={headers} activeIndex={index} />
    </div>
  );
};

'use client';

import { Component, type ReactNode } from 'react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: string;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center bg-black text-white p-6 text-center">
          <p className="text-lg mb-2">Camera error</p>
          <p className="text-sm text-gray-400 mb-4">{this.state.error}</p>
          <Link
            href="/"
            className="bg-white text-black px-6 py-3 rounded-xl font-semibold"
          >
            Go Back Home
          </Link>
        </div>
      );
    }

    return this.props.children;
  }
}

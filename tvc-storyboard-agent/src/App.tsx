import React, { useEffect } from 'react';
import Layout from './layout/Layout';
import { useChapterStore } from './stores';

const App: React.FC = () => {
  const loadChapters = useChapterStore((s) => s.load);

  useEffect(() => {
    void loadChapters();
  }, [loadChapters]);

  return <Layout />;
};

export default App;

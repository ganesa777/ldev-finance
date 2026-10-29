import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Compass } from 'lucide-react';
import { Orb3D } from '../components/dashboard/Orb3D';
import { Button } from '../components/ui/Button';
import { container, item } from '../lib/motion';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="glass-card rounded-4xl p-8 md:p-10 max-w-md w-full text-center space-y-6 relative overflow-hidden"
      >
        <motion.div variants={item} className="flex justify-center">
          <Orb3D variant="orb" size={110} />
        </motion.div>

        <motion.div variants={item} className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold">
            <Compass className="w-3.5 h-3.5" /> Galat 404
          </span>
          <h1 className="text-3xl font-extrabold text-ink tracking-tight">
            Halaman tidak ditemukan
          </h1>
          <p className="text-sm text-muted leading-relaxed">
            Alamat halaman yang kamu tuju tidak tersedia atau sudah dipindahkan. Yuk kembali ke beranda LDEV.
          </p>
        </motion.div>

        <motion.div variants={item}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            leftIcon={<Home className="w-5 h-5" />}
            onClick={() => navigate('/', { replace: true })}
          >
            Kembali ke Beranda
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;
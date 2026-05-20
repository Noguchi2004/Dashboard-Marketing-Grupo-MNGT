import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useApp } from '../store/AppContext';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export function FileUploader() {
  const { loadData, isLoading, error } = useApp();
  const [dragActive, setDragActive] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      await loadData(acceptedFiles[0]);
    }
  }, [loadData]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  } as any);

  return (
    <div className="min-h-screen bg-primary-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-primary-900 mb-2">Painel Orçamentário</h1>
          <p className="text-primary-500 text-sm">Faça o upload da sua planilha de controle para visualizar os dados.</p>
        </div>

        <div
          {...getRootProps()}
          className={cn(
            "relative group overflow-hidden rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer bg-white p-12 text-center",
            isDragActive ? "border-primary-900 bg-primary-50" : "border-primary-200 hover:border-primary-400"
          )}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center space-y-4">
            {isLoading ? (
              <Loader2 className="w-10 h-10 text-primary-900 animate-spin" />
            ) : (
              <UploadCloud className={cn("w-10 h-10 transition-colors", isDragActive ? "text-primary-900" : "text-primary-400 group-hover:text-primary-600")} />
            )}
            
            <div className="space-y-1">
              <p className="text-sm font-medium text-primary-900">
                {isLoading ? "Processando dados..." : "Clique ou arraste e solte o arquivo aqui"}
              </p>
              {!isLoading && (
                <p className="text-xs text-primary-500">Apenas arquivos .xlsx ou .xls</p>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-4 rounded-md bg-red-50 text-red-800 text-sm border border-red-200 flex items-start gap-3">
            <span>{error}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

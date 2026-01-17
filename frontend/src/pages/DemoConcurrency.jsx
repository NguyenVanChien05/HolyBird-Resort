import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './DemoConcurrency.css';

const DemoConcurrency = () => {
    const [transactionId, setTransactionId] = useState(1);
    const [logs, setLogs] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [transactionStatus, setTransactionStatus] = useState(null);

    const addLog = (message, type = 'info') => {
        const time = new Date().toLocaleTimeString();
        setLogs(prev => [{ time, message, type }, ...prev]);
    };

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`http://localhost:3000/api/demo/status/${transactionId}`);
            if (res.data.success && res.data.data) {
                setTransactionStatus(res.data.data.Status);
                // addLog(`Current Status: ${res.data.data.Status}`, 'info');
            } else {
                setTransactionStatus('Unknown (Not Found?)');
            }
        } catch (err) {
            setTransactionStatus('Error fetching status');
        }
    };

    // Helper to run specific API call
    const runRequest = async (endpoint, name, useFix = false) => {
        addLog(`[${name}] Started... (Fix Mode: ${useFix})`, 'info');
        try {
            const res = await axios.post(`http://localhost:3000/api/demo/${endpoint}`, {
                transactionId,
                useFix
            });
            addLog(`[${name}] Finished: ${res.data.message}`, 'success');
        } catch (err) {
            const msg = err.response?.data?.error || err.message;
            addLog(`[${name}] Failed: ${msg}`, 'error');
        }
    };

    const handleReset = async () => {
        addLog('Resetting Transaction...', 'warn');
        try {
            await axios.post('http://localhost:3000/api/demo/reset', { transactionId });
            addLog('Reset Complete. Status set to Pending.', 'success');
            fetchStatus();
        } catch (err) {
            addLog('Reset Failed!', 'error');
        }
    };

    const runScenario1_Bug = async () => {
        setIsProcessing(true);
        addLog('--- Running Scenario 1 (The BUG) ---', 'warn');

        // T1: Cancel (Will wait 10s)
        runRequest('cancel', 'T1 (Cancel)', false);

        // T2: Confirm (Runs immediately after T1 starts, simulating concurrent access)
        setTimeout(() => {
            runRequest('confirm', 'T2 (Confirm)', false);
        }, 1000); // 1s delay just to let T1 actually hit the server

        // Check status periodically
        const interval = setInterval(fetchStatus, 2000);
        setTimeout(() => {
            clearInterval(interval);
            setIsProcessing(false);
            addLog('--- Scenario Finished ---', 'info');
            fetchStatus();
        }, 12000);
    };

    const runScenario1_Fix = async () => {
        setIsProcessing(true);
        addLog('--- Running Scenario 1 (The FIX) ---', 'success');

        // T1: Cancel (With UPDLOCK)
        runRequest('cancel', 'T1 (Cancel)', true);

        // T2: Confirm (Should be blocked)
        setTimeout(() => {
            addLog('[T2] Attempting to Confirm (Should wait)...', 'info');
            runRequest('confirm', 'T2 (Confirm)', true);
        }, 1000);

        const interval = setInterval(fetchStatus, 2000);
        setTimeout(() => {
            clearInterval(interval);
            setIsProcessing(false);
            addLog('--- Scenario Finished ---', 'info');
            fetchStatus();
        }, 12000);
    };

    return (
        <div className="demo-container">
            <div className="demo-header">
                <h1>Demo: Lost Update (Concurrency Error)</h1>
                <p>Mô phỏng 2 giao dịch cùng cập nhật một bản ghi (Transaction).</p>
            </div>

            <div className="demo-controls">
                <div className="input-group">
                    <label>Transaction ID:</label>
                    <input
                        type="number"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label>Current Status:</label>
                    <strong>{transactionStatus || '---'}</strong>
                </div>
                <button className="btn btn-secondary" onClick={fetchStatus}>Refresh Status</button>
                <button className="btn btn-primary" onClick={handleReset}>Reset Data</button>
                <button className="btn btn-danger" onClick={() => setLogs([])}>Clear Logs</button>
            </div>

            <div className="demo-grid">
                <div className="card">
                    <h3>Scenario 1: The Bug (Lost Update)</h3>
                    <p>
                        <strong>T1 (Admin):</strong> Đọc Status 'Pending', chờ 10s, SET 'Cancelled'.<br />
                        <strong>T2 (Reception):</strong> Đọc Status 'Pending', SET 'Confirmed'.
                    </p>
                    <div className="scenario-controls">
                        <button className="btn btn-danger" onClick={runScenario1_Bug} disabled={isProcessing}>
                            Chạy Demo Lỗi
                        </button>
                        <small>Cả 2 sẽ báo thành công. Dữ liệu cuối cùng sẽ sai.</small>
                    </div>
                </div>

                <div className="card">
                    <h3>Scenario 2: The Fix (Locking)</h3>
                    <p>
                        <strong>T1 (Admin):</strong> Chạy với <code>UPDLOCK</code>.<br />
                        <strong>T2 (Reception):</strong> Sẽ bị block cho đến khi T1 xong.
                    </p>
                    <div className="scenario-controls">
                        <button className="btn btn-success" onClick={runScenario1_Fix} disabled={isProcessing}>
                            Chạy Demo Fix
                        </button>
                        <small>T2 sẽ chờ và sau đó thấy status đã đổi, nên sẽ báo lỗi.</small>
                    </div>
                </div>
            </div>

            <div className="logs-container">
                {logs.length === 0 && <div className="log-entry">Waiting for actions...</div>}
                {logs.map((log, index) => (
                    <div key={index} className={`log-entry log-${log.type}`}>
                        <span className="log-time">[{log.time}]</span>
                        {log.message}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DemoConcurrency;

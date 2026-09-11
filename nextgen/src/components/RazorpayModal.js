import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, SafeAreaView, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';

export default function RazorpayModal({ visible, orderDetails, onSuccess, onCancel, onError }) {
  if (!visible || !orderDetails) return null;

  const { keyId, orderId, amount, currency, name, description, prefill } = orderDetails;

  const razorpayOptions = {
    key: keyId || 'rzp_test_Taem2JpBTkElnV',
    amount: amount,
    currency: currency || 'INR',
    name: name || 'Nextgen Power Care',
    description: description || 'Online Payment',
    order_id: orderId,
    prefill: prefill || {},
    theme: {
      color: '#F1AA9B'
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body {
          background-color: #1a1a2e;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #ffffff;
        }
        .loader {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-top: 4px solid #F1AA9B;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      </style>
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    </head>
    <body>
      <div className="loader"></div>
      <p id="msg" style="font-size: 16px; font-weight: 500;">Opening Razorpay Payment Gateway...</p>
      <script>
        const options = ${JSON.stringify(razorpayOptions)};
        
        options.handler = function(response) {
          document.getElementById('msg').innerText = "Payment Successful! Processing...";
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'SUCCESS',
            data: response
          }));
        };

        options.modal = {
          ondismiss: function() {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'CANCELLED'
            }));
          }
        };

        try {
          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function(response) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'FAILED',
              error: response.error
            }));
          });
          window.onload = function() {
            rzp.open();
          };
        } catch(e) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'FAILED',
            error: { description: e.message }
          }));
        }
      </script>
    </body>
    </html>
  `;

  const handleMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.event === 'SUCCESS') {
        onSuccess(message.data);
      } else if (message.event === 'CANCELLED') {
        onCancel();
      } else if (message.event === 'FAILED') {
        onError(message.error?.description || 'Payment failed.');
      }
    } catch (e) {
      console.error('Error handling webview message:', e);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onCancel}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Razorpay Secure Payment</Text>
          <TouchableOpacity onPress={onCancel} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        <WebView
          source={{ html: htmlContent, baseUrl: 'https://checkout.razorpay.com' }}
          onMessage={handleMessage}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          renderLoading={() => (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#F1AA9B" />
              <Text style={styles.loadingText}>Connecting to Razorpay...</Text>
            </View>
          )}
        />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justify.content: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#161625',
    borderBottomWidth: 1,
    borderBottomColor: '#2b2b40',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#AAA',
    marginTop: 12,
    fontSize: 14,
  },
});

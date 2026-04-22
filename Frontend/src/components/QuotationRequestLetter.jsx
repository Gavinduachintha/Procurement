import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12 },
  header: { marginBottom: 20 },
  title: { fontSize: 18, marginBottom: 10 },
  section: { marginBottom: 10 },
});

const QuotationLetter = ({ supplier, suppliers, content, deadline }) => {
  const supplierList =
    Array.isArray(suppliers) && suppliers.length
      ? suppliers
      : supplier
        ? [supplier]
        : [];

  return (
    <Document>
      {supplierList.map((entry, index) => (
        <Page
          key={`${entry?.id || entry?.email || entry?.name || "supplier"}-${index}`}
          style={styles.page}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Quotation Request</Text>
          </View>

          <View style={styles.section}>
            <Text>To: {entry?.name || "Supplier"}</Text>
          </View>

          <View style={styles.section}>
            <Text>{content}</Text>
          </View>

          <View style={styles.section}>
            <Text>Submission Deadline: {deadline}</Text>
          </View>

          <View style={styles.section}>
            <Text>Thank you.</Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default QuotationLetter;

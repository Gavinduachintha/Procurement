import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 38,
    paddingBottom: 40,
    paddingLeft: 38,
    fontSize: 11,
    lineHeight: 1.45,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  headerTextBlock: {
    flexGrow: 1,
    paddingRight: 16,
  },
  universityName: {
    fontSize: 14,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  location: {
    marginTop: 2,
    fontSize: 11,
  },
  letterTitle: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
  },
  logo: {
    width: 66,
    height: 66,
    objectFit: "contain",
  },
  section: {
    marginBottom: 9,
  },
  strong: {
    fontWeight: 700,
  },
  table: {
    display: "table",
    width: "100%",
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 4,
    marginBottom: 10,
  },
  tableHeaderRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    backgroundColor: "#ececec",
  },
  tableDataRow: {
    flexDirection: "row",
  },
  tableColItem: {
    width: "40%",
    borderRightWidth: 1,
    borderRightColor: "#000",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  tableColSpec: {
    width: "60%",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  footerNote: {
    marginTop: 10,
  },
});

const QuotationLetter = ({
  supplier,
  suppliers,
  logoSrc,
  universityName,
  location,
  letterTitle,
  jobNumberWithMethod,
  itemDescription,
  technicalSpecifications,
  deadline,
  contactInformation,
}) => {
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
          <View style={styles.headerRow}>
            <View style={styles.headerTextBlock}>
              <Text style={styles.universityName}>
                {universityName || "WAYAMBA UNIVERSITY OF SRI LANKA"}
              </Text>
              <Text style={styles.location}>{location || "Kuliyapitiya."}</Text>
              <Text style={styles.letterTitle}>
                {letterTitle || "PURCHASE ORDER FOR STORES & SERVICES"}
              </Text>
            </View>
            {logoSrc ? <Image style={styles.logo} src={logoSrc} /> : null}
          </View>

          <View style={styles.section}>
            <Text>To: {entry?.name || "Supplier"}</Text>
          </View>

          <View style={styles.section}>
            <Text>
              <Text style={styles.strong}>
                Job Number (Procurement Method):{" "}
              </Text>
              {jobNumberWithMethod || "N/A"}
            </Text>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <View style={styles.tableColItem}>
                <Text style={styles.strong}>Item Description</Text>
              </View>
              <View style={styles.tableColSpec}>
                <Text style={styles.strong}>Technical Specifications</Text>
              </View>
            </View>
            <View style={styles.tableDataRow}>
              <View style={styles.tableColItem}>
                <Text>{itemDescription || "N/A"}</Text>
              </View>
              <View style={styles.tableColSpec}>
                <Text>{technicalSpecifications || "N/A"}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text>
              <Text style={styles.strong}>
                Deadline for Quotation Submission:{" "}
              </Text>
              {deadline || "N/A"}
            </Text>
          </View>

          <View style={styles.section}>
            <Text>
              <Text style={styles.strong}>Contact Information: </Text>
              {contactInformation ||
                "Procurement Division, Wayamba University of Sri Lanka"}
            </Text>
          </View>

          <View style={styles.footerNote}>
            <Text>
              Please submit your sealed quotation on or before the stated
              deadline.
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  );
};

export default QuotationLetter;

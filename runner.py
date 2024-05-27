from transformers import BartForConditionalGeneration, BartTokenizer

def summarize_text(text_chunk, max_length=100):
    model_name = "facebook/bart-large-cnn"
    tokenizer = BartTokenizer.from_pretrained(model_name)
    model = BartForConditionalGeneration.from_pretrained(model_name)

    inputs = tokenizer([text_chunk], max_length=1024, return_tensors='pt', truncation=True)
    summary_ids = model.generate(inputs['input_ids'], num_beams=4, max_length=max_length, early_stopping=True)
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)

    return summary

# Read text from output.txt file
with open("output.txt", "r", encoding="utf-8") as file:
    full_text = file.read()

# Split text into smaller chunks
chunk_size = 1000  # Adjust according to your needs
chunks = [full_text[i:i+chunk_size] for i in range(0, len(full_text), chunk_size)]

# Summarize each chunk
summaries = [summarize_text(chunk) for chunk in chunks]

# Join the summaries into one text
full_summary = " ".join(summaries)
print(full_summary)
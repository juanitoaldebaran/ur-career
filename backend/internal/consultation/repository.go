package consultation

import (
	"errors"
)

var (
	ErrConversationError = errors.New("conversation not found")
	ErrBusy              = errors.New("a reply is already being generated")
)

const defaultTitle = "New chat"

/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   get_next_line_bonus.c                              :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: lraghave <lraghave@student.42singapore.sg> +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/07/09 15:02:54 by lraghave          #+#    #+#             */
/*   Updated: 2025/07/11 13:42:10 by lraghave         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
#include "get_next_line_bonus.h"

char	*get_next_line(int fd)
{
	ssize_t		s_len;
	char		*line;
	static char	*stash[OPEN_MAX];

	if (fd < 0 || BUFFER_SIZE <= 0)
		return (NULL);
	ft_read_line(fd, &stash[fd]);
	if (!stash[fd])
		return (NULL);
	s_len = ft_strlen(stash[fd]);
	if (ft_newline(stash[fd]) != -1
		&& ft_newline(stash[fd]) != (ssize_t)s_len - 1)
	{
		ft_cpy_line(&stash[fd], &line);
		ft_stash_leftover(&stash[fd], &line);
	}
	else
	{
		ft_cpy_line(&stash[fd], &line);
		free (stash[fd]);
		stash[fd] = NULL;
	}
	return (line);
}

void	ft_stash_leftover(char **stash, char **line)
{
	char	*temp;
	ssize_t	index;

	temp = *stash;
	index = ft_newline(*stash);
	*stash = ft_strdup (*stash + index + 1);
	if (!*stash)
	{
		free (*line);
		*line = NULL;
		*stash = NULL;
	}
	free (temp);
}

void	ft_cpy_line(char **stash, char **line)
{
	size_t	i;
	size_t	len;

	if (ft_newline(*stash) != -1)
		len = ft_newline(*stash) + 1;
	else
		len = ft_strlen(*stash);
	*line = malloc((len + 1) * sizeof(char));
	if (!*line)
	{
		*line = NULL;
		return ;
	}
	(*line)[len] = '\0';
	i = 0;
	while (i < len)
	{
		(*line)[i] = (*stash)[i];
		i++;
	}
}

void	ft_read_line(int fd, char **stash)
{
	char	*buffer;
	ssize_t	bytes_read;

	buffer = malloc((BUFFER_SIZE + 1) * sizeof(char));
	if (!buffer)
		return ;
	bytes_read = 1;
	while (bytes_read > 0)
	{
		bytes_read = read(fd, buffer, BUFFER_SIZE);
		if (bytes_read == -1 || (bytes_read == 0 && !*stash))
			*stash = NULL;
		if (bytes_read == 0 || bytes_read == -1)
		{
			free (buffer);
			return ;
		}
		buffer[bytes_read] = '\0';
		ft_create_stash(stash, buffer);
		if (ft_newline(*stash) != -1)
			break ;
	}
	free (buffer);
}

void	ft_create_stash(char **stash, char *str)
{
	char	*temp;

	if (!*stash)
		*stash = ft_strdup(str);
	else
	{
		temp = *stash;
		*stash = ft_strjoin(*stash, str);
		free (temp);
	}
}
